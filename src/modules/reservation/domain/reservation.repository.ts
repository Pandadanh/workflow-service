export abstract class IReservationRepository {
  abstract create(data: {
    court_id: string;
    host_id: string;
    user_id: string;
    created_by?: string;
    updated_by?: string;
  }): Promise<any>;
}


