const pool = require("../config/database");

async function getNotifications(req, res) {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        type,
        title,
        message,
        link,
        created_at,
        read_at
      FROM notifications
      WHERE recipient_id = $1
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [req.user.id]
    );

    const unread = await pool.query(
      `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE recipient_id = $1 AND read_at IS NULL
      `,
      [req.user.id]
    );

    res.json({
      notifications: result.rows,
      unreadCount: Number(unread.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load notifications" });
  }
}

async function markNotificationRead(req, res) {
  try {
    const result = await pool.query(
      `
      UPDATE notifications
      SET read_at = COALESCE(read_at, NOW())
      WHERE id = $1 AND recipient_id = $2
      RETURNING id
      `,
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update notification" });
  }
}

module.exports = { getNotifications, markNotificationRead };
