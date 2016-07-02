-- NOTE: the Event scheduler must be enabled:
--SET GLOBAL event_scheduler = ON;

CREATE EVENT emparejar
    ON SCHEDULE
        EVERY 1 WEEK
    DO 
        CALL emparejar();
