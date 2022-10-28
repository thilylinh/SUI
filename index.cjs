const { Ed25519Keypair, RawSigner, LocalTxnDataSerializer, JsonRpcProvider } = require('@mysten/sui.js');
const { generateMnemonic } = require('@scure/bip39');
const { wordlist } = require('@scure/bip39/wordlists/english')
const { config } = require('dotenv')
const { writeFileSync, existsSync, mkdirSync } = require('fs')
const { join } = require('path')
console.clear()
const ED25519_DERIVE_PATH = `m/44'/784'/0'/0'/0'`
const SECP_256_DERIVE_PATH = `m/54'/784'/0'/0/0`;
const path = join(__dirname, 'data');
const dataPath = join(path, 'mnemonics.json');

config();

const logInfo = (message) => console.log(message);

const deriveKeypairPath = {
    Ed25519: ED25519_DERIVE_PATH,
    Secp256k1: SECP_256_DERIVE_PATH
}

const main = () => {
    var mainKeyPair;
    var provider;
    var signer;

    const initFolder = () => {
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true })
        }
    }
    const initAccount = () => {
        mainKeyPair = Ed25519Keypair.deriveKeypair(process.env.MNEMONIC, deriveKeypairPath.Ed25519);
        provider = new JsonRpcProvider(process.env.RPC_URL);
        signer = new RawSigner(
            mainKeyPair,
            provider,
            new LocalTxnDataSerializer(provider)
        );

        // signer.executeMoveCallWithRequestType
    }

    const newAccountkeyPair = (keyPair) => {
        return new RawSigner(
            keyPair,
            provider,
            new LocalTxnDataSerializer(provider)
        );
    };


    const getRandomAmount = (min, max) => {
        return Math.random() * (max - min) + min;
    }

    const run = async (walletCount) => {
        const createdAccounts = []
        try {
            for (let i = 0; i < walletCount; i++) {
                const mnemonic = generateMnemonic(wordlist);
                const newKeyPair = Ed25519Keypair.deriveKeypair(mnemonic, deriveKeypairPath.Ed25519);
                const address = newKeyPair.getPublicKey().toSuiAddress();

                const newSiger = newAccountkeyPair(newKeyPair);
                let amount = getRandomAmount(10001, 15000)

                const payload = {
                    suiObjectId: '0x1ebb9301e14611109f900a755f4f4608438066e0',
                    gasBudget: 100,
                    recipient: `0x${address}`,
                    amount: amount
                };

                logInfo(`Transfer ${payload.amount} SUI from ${mainKeyPair.getPublicKey().toSuiAddress()} to ${address}`);
                await signer.transferSuiWithRequestType(payload)

                createdAccounts.push({
                    mnemonic,
                    address: `0x${address}`
                })
                const name = `Linh ${Math.random()}`
                const desc = `Linh ${Math.random()}`
                const url ='ipfs://QmZPWWy5Si54R3d26toaqRiqvCH7HkGdXkxwUgCm2oKKM2?filename=img-sq-01.png'
                
                const result = await signer.executeMoveCallWithRequestType({
                    packageObjectId: '0x2',
                    module: 'devnet_nft',
                    function: 'mint',
                    typeArguments: [],
                    arguments: [name, desc, url],
                    gasBudget: 10000,
                });

                logInfo(JSON.stringify(result, null, 2))
            }
        } catch (error) {
            console.log('Has error. Exiting....');
            console.log(error.message);
        } finally {
            writeFileSync(dataPath, JSON.stringify(createdAccounts, null, 2))
        }
    }

    

    initFolder();
    initAccount();
    return {
        run
    }
}

main().run(2);