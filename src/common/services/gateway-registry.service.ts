import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

interface RegistryConfig {
  gatewayUrl: string;
  serviceName: string;
  baseUrl: string;
  instanceId: string;
  heartbeatInterval: number;
  retryInterval: number; // Interval for retry registration (default: 15s)
  enabled: boolean;
}

@Injectable()
export class GatewayRegistryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GatewayRegistryService.name);
  private readonly config: RegistryConfig;
  private heartbeatInterval?: NodeJS.Timeout;
  private retryInterval?: NodeJS.Timeout;
  private registered = false;
  private isRetrying = false;

  constructor(private readonly configService: ConfigService) {
    const port = this.configService.get<number>('port') || 8089;
    const host = process.env.SERVICE_HOST || 'localhost';
    const protocol = process.env.SERVICE_PROTOCOL || 'http';
    
    this.config = {
      gatewayUrl: this.configService.get<string>('GATEWAY_URL') || 'http://localhost:8080',
      serviceName: this.configService.get<string>('SERVICE_NAME') || 'workflow',
      baseUrl: this.configService.get<string>('SERVICE_BASE_URL') || `${protocol}://${host}:${port}`,
      instanceId: this.configService.get<string>('SERVICE_INSTANCE_ID') || `workflow-${randomUUID()}`,
      heartbeatInterval: parseInt(
        this.configService.get<string>('GATEWAY_HEARTBEAT_INTERVAL') || '5000',
        10,
      ),
      retryInterval: parseInt(
        this.configService.get<string>('GATEWAY_RETRY_INTERVAL') || '15000',
        10,
      ),
      enabled: this.configService.get<string>('GATEWAY_REGISTRY_ENABLED') !== 'false',
    };
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logger.warn('Gateway registry is disabled');
      return;
    }

    this.logger.log(
      `🔄 Attempting to register with gateway: ${this.config.gatewayUrl}`,
    );
    this.logger.log(
      `   Service: ${this.config.serviceName}, Instance: ${this.config.instanceId}, URL: ${this.config.baseUrl}`,
    );

    // Start registration attempt
    await this.attemptRegistration();
  }

  async onModuleDestroy() {
    // Stop retry interval
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = undefined;
    }

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    // Deregister if registered
    if (this.registered) {
      try {
        await this.deregister();
        this.logger.log('Service deregistered from gateway');
      } catch (error) {
        this.logger.error('Failed to deregister from gateway:', error);
      }
    }
  }

  private async register() {
    const registerUrl = `${this.config.gatewayUrl}/registry/register`;
    const payload = {
      service: this.config.serviceName,
      baseUrl: this.config.baseUrl,
      instanceId: this.config.instanceId,
      meta: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        startedAt: new Date().toISOString(),
      },
    };

    this.logger.debug(`Sending registration request to: ${registerUrl}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Registration failed with status ${response.status}: ${errorText}`);
        throw new Error(`Registration failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      this.registered = true;
      this.logger.debug(`Registration response: ${JSON.stringify(result, null, 2)}`);
      return result;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.logger.error(`Network error: Cannot connect to gateway at ${registerUrl}`);
        this.logger.error(`   Make sure gateway service is running and accessible`);
      }
      throw error;
    }
  }

  /**
   * Attempt to register with gateway
   * Will retry automatically every retryInterval until successful
   */
  private async attemptRegistration() {
    if (this.registered) {
      return; // Already registered
    }

    try {
      await this.register();
      this.registered = true;
      this.isRetrying = false;

      // Stop retry interval if running
      if (this.retryInterval) {
        clearInterval(this.retryInterval);
        this.retryInterval = undefined;
      }

      // Start heartbeat
      this.startHeartbeat();

      this.logger.log(
        `✅ Service registered successfully with gateway: ${this.config.serviceName} (${this.config.instanceId})`,
      );
      this.logger.log(`   Gateway URL: ${this.config.gatewayUrl}`);
      this.logger.log(
        `   Service will be accessible at: ${this.config.gatewayUrl}/${this.config.serviceName}/api/...`,
      );
    } catch (error) {
      this.logger.error('❌ Failed to register with gateway:', error);
      this.registered = false;

      // Start retry mechanism if not already running
      if (!this.isRetrying) {
        this.isRetrying = true;
        this.logger.warn(
          `   Will retry registration every ${this.config.retryInterval / 1000} seconds until successful...`,
        );

        // Start retry interval
        this.retryInterval = setInterval(async () => {
          if (!this.registered) {
            this.logger.log(
              `🔄 Retrying registration with gateway: ${this.config.gatewayUrl}`,
            );
            await this.attemptRegistration();
          }
        }, this.config.retryInterval);
      }
    }
  }

  private async sendHeartbeat() {
    if (!this.registered) {
      // Try to re-register if not registered
      await this.attemptRegistration();
      return;
    }

    const heartbeatUrl = `${this.config.gatewayUrl}/registry/heartbeat/${this.config.serviceName}/${this.config.instanceId}`;

    try {
      const response = await fetch(heartbeatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Heartbeat failed: ${response.status} - Service may need to re-register`);
        this.registered = false;
        // Trigger re-registration attempt
        await this.attemptRegistration();
      }
    } catch (error) {
      this.logger.warn('Heartbeat error:', error);
      this.registered = false;
      // Trigger re-registration attempt
      await this.attemptRegistration();
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private async deregister() {
    const deregisterUrl = `${this.config.gatewayUrl}/registry/${this.config.serviceName}/${this.config.instanceId}`;

    const response = await fetch(deregisterUrl, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Deregistration failed: ${response.status}`);
    }

    this.registered = false;
    return await response.json();
  }

  /**
   * Get service registration info
   */
  getRegistrationInfo() {
    return {
      registered: this.registered,
      serviceName: this.config.serviceName,
      instanceId: this.config.instanceId,
      baseUrl: this.config.baseUrl,
      gatewayUrl: this.config.gatewayUrl,
    };
  }
}


