INSERT INTO "TournamentCategory" (id, name, description, type) VALUES
(
    'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
    'Đơn Nam',
    'Giải đấu đơn nam - 1 người đấu với 1 người',
    'SINGLE'
),
(
    'b2d3e4f5-6789-4abc-8123-4567abcdef89',
    'Đơn Nữ',
    'Giải đấu đơn nữ - 1 người đấu với 1 người',
    'SINGLE'
),
(
    'c3e4f5a6-7890-4bcd-9234-5678bcdef901',
    'Đôi Nam',
    'Giải đấu đôi nam - 2 người đấu với 2 người (toàn nam)',
    'TEAM'
),
(
    'e5a6b7c8-9012-4def-b456-7890def12345',
    'Đôi Nữ',
    'Giải đấu đôi nữ - 2 người đấu với 2 người (toàn nữ)',
    'TEAM'
),
(
    '9b8c7d6e-1f23-48a4-9d56-c7a8b9e0d123',
    'Đôi Nam Nữ',
    'Giải đấu đôi nam nữ - 2 người đấu với 2 người (1 nam + 1 nữ mỗi đội)',
    'TEAM'
)
ON CONFLICT (name) DO NOTHING;