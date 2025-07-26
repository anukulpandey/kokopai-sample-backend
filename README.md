Kokopai Authentication Flow
===========================

1. **User initiates login**
   |
   v
2. **Frontend (connectToKokopai) requests nonce**
   -> `GET /nonce?address=<user_address>` to backend
   |
   v
3. **Backend checks userDb**
   - If address not found, generate a new nonce
   - Return `{ nonce: "<random_nonce>" }`
   |
   v
4. **Frontend signs nonce**
   - Uses `account.signer.signRaw` to sign the nonce
   |
   v
5. **Frontend sends signature to backend**
   -> `POST /auth { address, signature, evmAddress }`
   |
   v
6. **Backend verifies signature**
   - If valid, generate a JWT token
   - If invalid, return error `Invalid signature`
   |
   +--> [Valid]  Return `{ status: "success", token: "<JWT>" }`
   |
   +--> [Invalid] Return `{ status: "error" }`
   |
   v
7. **Frontend stores token**
   - Save JWT in `localStorage`
   |
   v
8. **Authentication Complete**
