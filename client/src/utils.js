import Web3 from "web3";
import Wallet from "./contracts/Wallet.json";
import detectEthereumProvider from "@metamask/detect-provider";

export const getWeb3 = () =>
  new Promise(async (resolve, reject) => {
    let provider = await detectEthereumProvider();
    if (provider) {
      await provider.request({ method: "eth_requestAccounts" });
      try {
        const web3 = new Web3(window.ethereum);
        resolve(web3);
      } catch (error) {
        reject(error);
      }
    }
    reject("Install Metamask");
  });

export const getWallet = async (web3) => {
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = Wallet.networks[networkId];
  return new web3.eth.Contract(
    Wallet.abi,
    deployedNetwork && deployedNetwork.address
  );
};
