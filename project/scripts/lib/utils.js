// scripts/lib/utils.js
export const difficultyBadge = (level) =>
  level === 3 ? { cls: "gold", text: "Hard" }
: level === 2 ? { cls: "silver", text: "Medium" }
:               { cls: "bronze", text: "Easy" };

export const weekKey = (d = new Date()) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() || 7);
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
};
