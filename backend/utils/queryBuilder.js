const buildCondition = (filterType, userId, teamId) => {
  if (filterType === 'personal') {
    return { clause: 'user_id = ? AND team_id IS NULL', params: [userId] };
  } else if (filterType === 'team') {
    return { clause: 'team_id = ?', params: [teamId] };
  } else {
    return { 
      clause: '(user_id = ? OR team_id IN (SELECT team_id FROM team_members WHERE user_id = ? AND is_deleted = FALSE))', 
      params: [userId, userId] 
    };
  }
};

module.exports = { buildCondition };