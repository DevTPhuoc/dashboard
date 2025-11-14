CREATE TRIGGER trigger_status_update
AFTER UPDATE OF Status ON repair_requests
BEGIN
    -- Yêu cầu 1: Thêm status mới vào bảng status nếu chưa có
    INSERT INTO status (statusName)
    SELECT NEW.Status
    WHERE NEW.Status IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM status WHERE statusName = NEW.Status
      );

    -- Yêu cầu 2: Ghi lịch sử sửa chữa khi status chuyển thành 'waitPR'
    INSERT INTO repair_history (
        DeviceID,
        RequestID,
        RepairDate,
        RepairType,
        Cost,
        Notes,
        TechName
    )   
    SELECT
        NEW.DeviceID,
        NEW.id,
        datetime('now', 'localtime'),
        'External',
        (
            SELECT qo.unit_price
            FROM quote_options qo
            JOIN quotations q ON qo.quotation_id = q.id
            WHERE q.RequestID = NEW.id AND qo.status = 'Approved'
            ORDER BY qo.option_no DESC
            LIMIT 1
        ),
        (
            SELECT qo.quotation_note
            FROM quote_options qo
            JOIN quotations q ON qo.quotation_id = q.id
            WHERE q.RequestID = NEW.id AND qo.status = 'Approved'
            ORDER BY qo.option_no DESC
            LIMIT 1
        ),
        NEW.TechName
    WHERE NEW.Status = 'waitPR';

    -- Yêu cầu 3: Ghi lịch sử thay đổi status, chỉ khi giá trị thực sự thay đổi
    INSERT INTO repair_status_history (
        repair_request_id,
        old_status,
        new_status,
        change_timestamp, 
        changed_by, 
        notes
    )
    SELECT NEW.id, OLD.Status, NEW.Status, datetime('now', 'localtime'), NEW.ChangeByUsername, NEW.NoteByUsername
    WHERE OLD.Status IS NOT NULL
      AND NEW.Status IS NOT NULL
      AND OLD.Status != NEW.Status;
END;


CREATE TRIGGER trg_quote_options_delete_history
AFTER DELETE ON quote_options
BEGIN
    -- Dùng CASE WHEN để xác định hành động
    INSERT INTO quotation_history (id_request, history_delete)
    SELECT 
        q.RequestID,
        CASE 
            -- Nếu đã có dòng với id_request → lấy history cũ và nối thêm
            WHEN EXISTS (SELECT 1 FROM quotation_history WHERE id_request = q.RequestID) THEN
                (SELECT 
                    substr(history_delete, 1, length(history_delete) - 1) || ',' ||
                    '{"date":"' || datetime('now', 'localtime') || '",' ||
                    '"vendor":"' || OLD.vendor_name || '",' ||
                    '"Price":"' || OLD.unit_price || '",' ||
                    '"Remark":"' || OLD.quotation_note || '",' ||
                    '"LMNote":"' || OLD.lab_note || '",' ||
                    '"EMNote":"' || OLD.em_note || '"}' ||
                    ']'
                 FROM quotation_history 
                 WHERE id_request = q.RequestID)
            -- Nếu chưa có → tạo mới mảng JSON
            ELSE
                '[' ||
                '{"date":"' || datetime('now', 'localtime') || '",' ||
                '"vendor":"' || OLD.vendor_name || '",' ||
                '"Price":"' || OLD.unit_price || '",' ||
                '"Remark":"' || OLD.quotation_note || '",' ||
                '"LMNote":"' || OLD.lab_note || '",' ||
                '"EMNote":"' || OLD.em_note || '"}' ||
                ']'
        END
    FROM quotations q
    WHERE q.id = OLD.quotation_id
    ON CONFLICT(id_request) DO UPDATE SET history_delete = excluded.history_delete;
END;

CREATE TRIGGER trigger_status_add
AFTER INSERT ON repair_requests
BEGIN
    INSERT INTO status (
        statusName
    )
    SELECT NEW.Status
    WHERE NEW.Status IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM status WHERE statusName = NEW.Status
      );
END;