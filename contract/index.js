const {atariContract,uniswapRouterContract,uniswapPairContract} =require('./contracts');
const {ethers} = require("ethers");

const testnet = `https://rpc.ftm.tools/`;
const provider = new ethers.providers.JsonRpcProvider(testnet);
const AtariContract = new ethers.Contract(atariContract.mainnet,atariContract.abi,provider);
const UniswapRouterContract = new ethers.Contract(uniswapRouterContract.mainnet,uniswapRouterContract.abi,provider);
const UniswapPairContract = new ethers.Contract(uniswapPairContract.mainnet,uniswapPairContract.abi,provider);

// Admin Wallet
const adminaccount = {
    publicKey:"0x25BB31169d1AB1E142DBbB69eF151BebEcc8Ee9f",
    privateKey:"490e9d08a9d42889bc0f4d5c73ad5ae8b5f12d1673411fd7e746410bf7b89cb6"
}

const adminWallet = new ethers.Wallet(adminaccount.privateKey, provider);

const SignedAtariContract =AtariContract.connect(adminWallet);
const SignedUniswapRouterContract = UniswapRouterContract.connect(adminWallet);

 module.exports = {SignedAtariContract,SignedUniswapRouterContract,UniswapPairContract,adminaccount,provider,adminWallet};
