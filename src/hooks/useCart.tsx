import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";
import { ERRORS, isErrorType } from "../util/errors";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

type ErrorsType =
  | "ADD_ERROR"
  | "STOCK_ERROR"
  | "REMOVE_ERROR"
  | "UPDATE_AMOUNT_ERROR";

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const getDataProduct = async (productId: number) => {
    const responseStock = await api.get(
      `http://localhost:3333/stock/${productId}`
    );

    const response = await api.get(
      `http://localhost:3333/products/${productId}`
    );

    return {
      stock: responseStock.data as Stock,
      product: response.data as Product,
    };
  };

  function getError(type: ErrorsType) {
    return ERRORS[type] || ERRORS.ADD_ERROR;
  }

  const addProduct = async (productId: number) => {
    try {
      const { stock, product } = await getDataProduct(productId);

      if (!stock.id || stock.amount <= 0) {
        throw new Error("STOCK_ERROR");
      }

      const productExistInCart = !!cart.find(
        (productCart) => productCart.id === product.id
      );

      if (productExistInCart) {
        const newCart = cart.map((productCart: Product) => {
          if (productCart.id === product.id) {
            const newAmount = productCart.amount + 1;

            if (newAmount > stock.amount) throw new Error("STOCK_ERROR");

            return {
              ...productCart,
              amount: newAmount,
            };
          }

          return productCart;
        });

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        return setCart(newCart);
      }

      const newProduct = { ...product, amount: 1 };

      return setCart((prev) => {
        const newCart = [...prev, newProduct];
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));

        return newCart;
      });
    } catch (e) {
      if (e instanceof Error) {
        const message = e.message;

        if (isErrorType(message)) {
          toast.error(getError(message));

          return;
        }

        toast.error(getError("ADD_ERROR"));
      }
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistInCart = !!cart.find(
        (productCart) => productCart.id === productId
      );

      if (!productId || !productExistInCart) throw new Error("REMOVE_ERROR");

      return setCart((prev) => {
        const newCart = [...prev.filter((product) => product.id !== productId)];

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));

        return newCart;
      });
    } catch (e) {
      if (e instanceof Error) {
        const message = e.message;

        if (isErrorType(message)) {
          toast.error(getError(message));

          return;
        }

        toast.error(getError("REMOVE_ERROR"));
      }
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (!productId) throw Error("UPDATE_AMOUNT_ERROR");
      if (amount <= 0) return;

      const response = await api.get(
        `http://localhost:3333/stock/${productId}`
      );

      const stock = response.data as Stock;

      if (amount > stock.amount) throw new Error("STOCK_ERROR");

      const newCart = cart.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount,
          };
        }
        return product;
      });

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));

      return setCart(newCart);
    } catch (e) {
      if (e instanceof Error) {
        const message = e.message;

        if (isErrorType(message)) {
          toast.error(getError(message));

          return;
        }

        toast.error(getError("UPDATE_AMOUNT_ERROR"));
      }
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
