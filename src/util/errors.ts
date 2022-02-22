type ErrorsType =
  | "ADD_ERROR"
  | "STOCK_ERROR"
  | "REMOVE_ERROR"
  | "UPDATE_AMOUNT_ERROR";

export const ERRORS = {
  ADD_ERROR: "Erro na adição do produto",
  STOCK_ERROR: "Quantidade solicitada fora de estoque",
  REMOVE_ERROR: "Erro na remoção do produto",
  UPDATE_AMOUNT_ERROR: "Erro na alteração de quantidade do produto",
};

export const isErrorType = function (keyInput: string): keyInput is ErrorsType {
  return Object.keys(ERRORS).includes(keyInput);
};
