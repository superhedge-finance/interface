import React, { useEffect, useState } from "react";
import axios from "../../service/axios";
import { useAccount } from "wagmi";

interface RefCodeHandlerProps {
  setIsPopupVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBlurred: React.Dispatch<React.SetStateAction<boolean>>;
}

const RefCodeHandler: React.FC<RefCodeHandlerProps> = ({ setIsPopupVisible, setIsBlurred }) => {
  const { address } = useAccount();
  const [inputValue, setInputValue] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  useEffect(() => {
    (async () => {
      // console.log("check address");
      // console.log(address);
      let isVisible = true;
      let isBlurred = true;

      if (address) {
        try {
          const results = await axios.post(`refcodes/check-whitelist?address=${address}`);
          if (results.data) {
            isVisible = false;
            isBlurred = false;
          }
        } catch (error) {
          console.error("Error checking whitelist:", error);
        }
      }

      setIsPopupVisible(isVisible);
      setIsBlurred(isBlurred);
    })();
  }, [address, setIsPopupVisible, setIsBlurred]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async () => {
    // console.log(inputValue);
    // console.log(address);
    if (inputValue && address) {
      const results = await axios.post(`/refcodes/signUp?refcode=${inputValue}&address=${address}`);
      // console.log(results.data);
      if (results.data) {
        setIsPopupVisible(false);
        setIsBlurred(false);
        setWarningMessage("");
        setInputValue("");
      } else {
        setWarningMessage("Wrong Code");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleCancel = () => {
    setIsPopupVisible(false);
    setInputValue("");
    setWarningMessage("");
  };

  return (
    <>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="border p-2 mb-2 w-full"
      />
      <div className="flex justify-between">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Confirm
        </button>
        <button
          onClick={handleCancel}
          className="bg-gray-500 text-white p-2 rounded"
        >
          Cancel
        </button>
      </div>
      {warningMessage && (
        <p className="text-red-500 mt-2">{warningMessage}</p>
      )}
    </>
  );
};

export default RefCodeHandler;