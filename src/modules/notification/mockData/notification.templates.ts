import { NotificationType } from "../dto";

export const NotificationTemplates = {
    GROUP_BOOKING_CREATED: (groupId: string, bookingId: string, memberId: string, ) => ({
        userId: memberId,
        title: 'Có booking mới từ group',
        message: 'Thành viên đã tạo booking mới trong group',
        type: NotificationType.BOOKING,
        resourceType: 'booking' as const,
        actionUrl: `/badminton-bookings/${bookingId}`,
        metadata: {
            group_id: groupId,
        },
    }),
}