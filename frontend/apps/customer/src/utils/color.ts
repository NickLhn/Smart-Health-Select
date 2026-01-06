export const getCategoryColor = (name: string) => {
  const colors = [
    '#FF7875', '#FF9C6E', '#FFC069', '#FFD666', 
    '#95DE64', '#5CDBD3', '#69C0FF', '#85A5FF', 
    '#B37FEB', '#FF85C0'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
