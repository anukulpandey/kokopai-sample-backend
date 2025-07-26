const express = require ('express');
const cors = require('cors');
const { decodeAddress, signatureVerify } = require('@polkadot/util-crypto');
const { u8aToHex,u8aWrapBytes} = require('@polkadot/util');
const jwt = require('jsonwebtoken');


const app = express();

app.use(express.json());

app.use(cors({
  origin: 'http://127.0.0.1:8000', // Replace with your Kokopai URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));


const port = 3000;

app.get("/",(req,res)=>{
    res.status(200).json({
        message:"Kokopai sample backend"
    });
});

// replace this with a database in production this is just a sample, this should have a field called nonce in the db for the particular user
const userDb = {};

// nonce generator function
const generateNonce = () => Math.random().toString(36).substring(2, 15);

const isValidSignature = (signedMessage, signature, address) => {
    const publicKey = decodeAddress(address);
    const hexPublicKey = u8aToHex(publicKey);
    let res = signatureVerify(signedMessage, signature, hexPublicKey);
    if (res.crypto === 'none') {
        res = signatureVerify(u8aWrapBytes(signedMessage), signature, hexPublicKey);
    }
    return res.isValid;
};

// generates the json web token for authentication
const generateToken = (address, evmAddress) => {
    return jwt.sign({ address, evmAddress }, "sdfsfadfasdfafe43r42dfsdfs", { expiresIn: '72h' });
};

// user sends /nonce?address=<EVM_ADDRESS>
app.get('/nonce', (req, res) => {
    try {
      const address = (req.query.address || '').trim();
      if (!address) {
        return res.status(400).json({ error: 'address query param is required' });
      }
  
      if (!userDb[address]) {
        userDb[address] = generateNonce();
      }
  
      return res.json({ nonce: userDb[address] });
    } catch (error) {
      console.error('GET /nonce error:', error);
      return res.status(500).json({ error: 'internal error' });
    }
});

// expects address,evmAddress and signature in body
app.post('/auth',async(req,res)=>{
    const address = req.body.address; //Native address of reef chain, starts with 5...
    const evmAddress = req.body.evemAddress;
    const signature = req.body.signature; // this is the signature signed with the nonce which the user gets from /nonce route

    const signatureValidity = isValidSignature(userDb[address],signature,address);
    console.log(userDb[address],signature,address)

    if(signatureValidity){
        // update the nonce
        userDb[address] = generateNonce() // so that the next request will be completely new
        const jwt = generateToken(address,evmAddress);
        res.status (200).send ({
            status: 'success',
            token: jwt,
            message: 'Valid signature'
        });
    }else{
        res.status (400).send ({
            status: 'error',
            message: 'Invalid signature'
        });
    }
});

app.listen (port, () => {
    console.log (`Listening on port http://localhost:${port}`);
});