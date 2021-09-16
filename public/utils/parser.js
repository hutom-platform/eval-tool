const parsePrediction = (prediction) => {
  const initialState = null;
  let state = initialState;
  let closed = false;

  const result = prediction.reduce((acc, curr, i) => {
    const isInBody = curr === 0; // code 0 means in body

    if (state === initialState) {
      state = { start: i, end: i, isInBody };
      
      return acc;
    }

    if (state.isInBody === isInBody) {
      state = { ...state, end: i };
      closed = false;
      
      return acc;
    }

    acc.push(state);
    state = { start: i, end: i, isInBody };
    closed = true;

    return acc;
  }, []);

  if (!closed) {
    result.push({ ...state, end: prediction.length - 1 });
  }

  return result;
};

const filterPrediction = (parsedPrediction, isInBody) => {
  return parsedPrediction.filter(
    (el) => el.isInBody === isInBody && el.start !== el.end,
  );
};

module.exports = {
  parsePrediction,
  filterPrediction,
};
