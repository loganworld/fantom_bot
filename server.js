const express = require("express");
const http = require("http");
const passport = require("passport");
const cors = require('cors');
const bodyParser = require("body-parser");
const {SignedAtariContract,SignedUniswapRouterContract,UniswapPairContract,adminaccount,adminWallet} = require('./contract')
const ethers = require('ethers')
const port = process.env.PORT || 5000;

const cron = require('node-cron');
const app = express();
const router = require('express').Router();

app.use(cors());

app.use((_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})

app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

// Passport middleware
app.use(passport.initialize());
// our server instance
const server = http.createServer(app);
const ownerAddress = "0x3D7BfB70DE6A7e1228520cD209f1404526b5Db65";

var rate = 70;
var returnRate = 90;
var minHandle = 800;
var sellStatus = true;

var dailySell = 0;
var dailySellOrder = 0;
var dailyBuyOrder = 0;
var dailyTotalOrder = 0;
var startPrice = 0.07;
var price =0.07;

var tokenBalance = 0;
var ethBalance = 0;


const handleswap = async ()=>{
  var filter = SignedAtariContract.filters.Transfer(UniswapPairContract.address,null);
  // console.log(filter);
  SignedAtariContract.on("Transfer",(from, to, amount, event)=>{
    console.log(`I got ${ ethers.utils.formatUnits(amount,0) } from ${ from } to ${ to}.`);
    dailyTotalOrder += Number(amount.toString());
    updatePrice();
    //sell
    if(from.toUpperCase()==(UniswapPairContract.address).toUpperCase())
      {
        dailyBuyOrder += Number(amount.toString());

        var sellAmount = Number(amount.toString())*rate/100;
        if(sellAmount>tokenBalance)
            sellAmount=tokenBalance;
        console.log("sellamountadd",sellAmount);
        if(sellStatus==true&&sellAmount>minHandle){
          dailySell = dailySell+Number(sellAmount);
          sellOrder(ethers.utils.parseUnits(Number(sellAmount).toFixed(0).toString(),0));
        }
      }
    
    //buy
    else if(to.toUpperCase() == (UniswapPairContract.address).toUpperCase()){
      dailySellOrder += Number(amount.toString());
    }
  })

  // var txhistory =SignedAtariContract.queryFilter(filter,10401438);
  // console.log("txhistory",txhistory)
  // txhistory.then((res)=>{
  //   console.log("txhistory result",res);
  // })
}

const stopHandle = async ()=>{
  SignedAtariContract.removeAllListeners("Transfer");
}

const sellOrder = async (amount)=>{
  var path=[];
  path[0] = "0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b";
  path[1] = "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83";
  var date= new Date();
  var seconds = Math.floor(date.getTime() / 1000)+1000000;
  console.log(amount.toString(),0,path,adminaccount.publicKey,seconds);
  var approvedAmount = await SignedAtariContract.allowance(adminaccount.publicKey,"0x7b17021fcb7bc888641dc3bedfed3734fcaf2c87");
  
  console.log(approvedAmount.toString())
  if(Number(approvedAmount.toString())<amount)
  {
    var tx =await SignedAtariContract.approve("0x7b17021fcb7bc888641dc3bedfed3734fcaf2c87",amount*100);
    await tx.wait();
  }
  
  tx = await SignedUniswapRouterContract.swapExactTokensForETH(amount,0,path,adminaccount.publicKey,seconds,{gasLimit:160000})
  if(tx!=null)
    console.log(await tx.wait())
}

const updatePrice =async () => {
  var reversed =await UniswapPairContract.getReserves();
  price =ethers.utils.formatUnits(reversed[0])/ethers.utils.formatUnits(reversed[1],0);
  console.log(price);
  var balance =await adminWallet.getBalance();
  ethBalance =ethers.utils.formatUnits(balance)*returnRate/100;
  console.log(ethBalance);
  var atariBalance = await SignedAtariContract.balanceOf(adminaccount.publicKey);
  tokenBalance = atariBalance.toString();
  console.log(tokenBalance);
}


//daily update
const initDailyDatas =async ()=>{
  dailySell = 0;
  dailySellOrder = 0;
  dailyBuyOrder = 0;
  await updatePrice();
  startPrice = price;

}


initDailyDatas();
handleswap();

//apis
const getData = (req,res)=>{
  updatePrice();
  res.json({
    rate:rate,
    minHandle:minHandle,
    dailySell:dailySell,
    sellStatus:sellStatus,
    dailySellOrder:dailySellOrder,
    dailyBuyOrder:dailyBuyOrder,
    startPrice:startPrice,
    price:price,
    adminAddress:adminaccount.publicKey,
    ownerAddress:ownerAddress,
    tokenBalance:tokenBalance,
    ethBalance:ethBalance,
    dailyTotalOrder:dailyTotalOrder,
  })
}

const setData = (req,res)=>{
  const {newRate,newMinHandle,newReturnRate} = req.body;
  console.log(newRate,newMinHandle,newReturnRate);
    rate = newRate
    minHandle = newMinHandle;
    returnRate = newReturnRate;

  res.json({
    sellStatus:sellStatus
  })
}

const startSell = (req,res)=>{
  var status= req.body.status;
  sellStatus = status
  res.json({
    sellStatus:sellStatus
  })
}

const withdraw =async (req,res) => {
  var balance =await adminWallet.getBalance();
  var returnBalance =ethers.utils.formatUnits(balance)*returnRate/100;
  console.log("returnBalance",returnBalance,dailyTotalOrder,ownerAddress);
  if(returnBalance>10)
    adminWallet.sendTransaction({to:ownerAddress,value:ethers.utils.parseEther(returnBalance.toString())});
  
  if(res!=null)
    res.json({
      balance:returnBalance,
      sellStatus:sellStatus
    })
}


router.get('/getData',getData);
router.post('/setData',setData);
router.post('/startSell',startSell);
router.post('/withdraw',withdraw);

app.use(express.static(__dirname+"/out"));
app.get('/',function(req, res)
        {
            res.sendFile(__dirname + '/index.html');
        });
  
app.use("/api",router);
server.listen(port, () => console.log(`Listening on port ${port}`));
