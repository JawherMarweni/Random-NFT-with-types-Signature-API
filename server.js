const express = require("express");
const ethers = require("ethers");
const fs = require("fs");

const app = express();
const port = 3000;

const provider = ethers.getDefaultProvider();

const signMessage = async (hash, privateKey) => {
  const wallet = new ethers.Wallet(privateKey, provider);
  const signature = await wallet.signMessage(hash);
  return signature;
};

app.get("/getSignatures", async (req, res) => {
  try {
    const { types, receiver } = req.query;

    if (!Array.isArray(types)) {
      return res.status(400).json({ error: "Types must be an array" });
    }

    const jsonData = JSON.parse(fs.readFileSync("config.json"));
    const { privateKeys, index } = jsonData;

    const hash = ethers.utils.solidityKeccak256(
      ["uint256[]", "uint256", "address"],
      [types.map(Number), index, receiver]
    );

    const signatures = await Promise.all(
      privateKeys.map((privateKey) =>
        signMessage(ethers.utils.arrayify(hash), privateKey)
      )
    );

    jsonData.index += 1;
    fs.writeFileSync("config.json", JSON.stringify(jsonData, null, 2));

    res.json({ signatures, index });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate signatures" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
