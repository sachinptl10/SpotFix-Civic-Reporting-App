export const formatChartData = (rows, xAxis, yAxis) => {
  if (!rows || !xAxis || !yAxis) return [];
  return rows.map(row => ({
    name: String(row[xAxis]),
    value: Number(row[yAxis]) || 0,
    ...row
  }));
};
