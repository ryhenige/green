// Utility functions shared by backend modules
function isStrictSelect(sql) {
  // Only allow a single SELECT statement, no comments, no semicolons (except possibly at the end)
  const trimmed = sql.trim().replace(/;\s*$/, '');
  if (!/^SELECT\b/i.test(trimmed)) return false;
  if (/--|\/\*/.test(trimmed)) return false;
  if (/;.*\S/.test(trimmed)) return false; // semicolon not at end
  return true;
}

module.exports = {
  isStrictSelect
};
