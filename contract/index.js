const {atariContract,uniswapRouterContract,uniswapPairContract} =require('./contracts');
const {ethers} = require("ethers");

const testnet = `wss://bitter-falling-wildflower.fantom.quiknode.pro/0e59098f9c21e5fdfe83e1e37d7d895959000c8b/`;
const provider = new ethers.providers.WebSocketProvider(testnet);
const AtariContract = new ethers.Contract(atariContract.mainnet,atariContract.abi,provider);
const UniswapRouterContract = new ethers.Contract(uniswapRouterContract.mainnet,uniswapRouterContract.abi,provider);
const UniswapPairContract = new ethers.Contract(uniswapPairContract.mainnet,uniswapPairContract.abi,provider);

// Admin Wallet
const adminaccount = {
    publicKey:"",
    privateKey:""
}

const adminWallet = new ethers.Wallet(adminaccount.privateKey, provider);

const SignedAtariContract =AtariContract.connect(adminWallet);
const SignedUniswapRouterContract = UniswapRouterContract.connect(adminWallet);

const drawCall = async () => {
    var tx =await SignedLotteryContract.drawing("11")
        .catch((err) => {
        console.log("contract err",err)
    });
    console.log(tx.hash);
    console.log(await tx.wait());
 };


 module.exports = {SignedAtariContract,SignedUniswapRouterContract,UniswapPairContract,adminaccount,provider,adminWallet};
