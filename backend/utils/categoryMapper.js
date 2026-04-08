const mapCategoryToKorean = (category) => {
  const mapper = {
    'WORK': '업무',
    'EXERCISE': '운동',
    'SELF_DEV': '공부',
    'HOBBY': '개인',
    'ETC': '기타'
  };
  return mapper[category] || '기타';
};

module.exports = { mapCategoryToKorean };