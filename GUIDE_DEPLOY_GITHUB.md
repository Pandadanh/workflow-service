# Hướng dẫn cách build Source code không cần lên server

## Bước 1

Vào github repo chọn tab Tags ở hàng branch

## Bước 2
Trong phần Tags sẽ có 2 tab là Release và Tags. Release là tạo ra 1 tag mới khi build source. Nhấn chọn Release sẽ có nút Draft a new release

## Bước 3
Trong phần New release chỉ quan tâm 3 mục là Tag: Select tag, Target: develop, Release Title
 - Tag: đây sẽ tạo tag mới để build môi trường, định dạng đặt tag là dev-v0.0.*(* sẽ là từng version mỗi khi tạo tag) tránh đặt trùng tên
 - Target: build lên nhánh nào thì chọn nhánh đó, production thì chọn production, develop chọn develop... Lưu ý: cần phải merge code mới nhất của nhánh để build
 - Release Title: Đặt tên release cho từng tag để xác định được lần build đó cho feature/bug/release

## Bước 4
Kéo xuống dưới sẽ có 2 checkbox luôn luôn mặc định Set as the lastest release sau đó nhấn Publish release

## Bước 5
Qua Tab Action sẽ hiện workflow mà đã tạo chỉ khi build thành công là có code mới lên server