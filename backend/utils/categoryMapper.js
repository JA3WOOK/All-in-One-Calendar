export const mapCategoryToKorean = (dbCategory) => {
  const map = {
    WORK: '업무',
    EXERCISE: '운동',
    SELF_DEV: '공부',
    HOBBY: '개인'
  };
  return map[dbCategory] || '기타';
};