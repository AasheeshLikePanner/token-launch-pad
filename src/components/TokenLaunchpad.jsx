import { createInitializeMetadataPointerInstruction, createInitializeMintInstruction, ExtensionType, getMintLen, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import React, { useState } from 'react';
import './TokenLaunchpad.css';

const Input = ({ id, label, type, value, onChange }) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value.length > 0;

    return (
        <div className={`input-group ${isFocused || hasValue ? 'is-focused' : ''}`}>
            <label htmlFor={id} className="input-label">
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="input-field"
            />
        </div>
    );
};

export default function TokenLaunchpad() {
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const createToken = async () => {
        if (!publicKey) {
            alert("Please connect your wallet!");
            return;
        }
        setIsLoading(true);
        try {
            const mintKeypair = Keypair.generate();
            const metaData = {
                updateAuthority: publicKey,
                mint: mintKeypair.publicKey,
                name,
                symbol,
                uri: imageUrl,
                additionalMetadata: [],
            };

            const mintLen = getMintLen([ExtensionType.MetadataPointer]);
            const metaDataLen = pack(metaData).length;

            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metaDataLen);

            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen + metaDataLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeMetadataPointerInstruction(
                    mintKeypair.publicKey,
                    publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID,
                ),
                createInitializeMintInstruction(
                    mintKeypair.publicKey,
                    9, // Decimals
                    publicKey,
                    publicKey,
                    TOKEN_2022_PROGRAM_ID,
                ),
                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    metadata: mintKeypair.publicKey,
                    mint: mintKeypair.publicKey,
                    mintAuthority: publicKey,
                    name: metaData.name,
                    symbol: metaData.symbol,
                    uri: metaData.uri,
                    updateAuthority: publicKey,
                }),
            );
            transaction.feePayer = publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.partialSign(mintKeypair);

            const signature = await sendTransaction(transaction, connection, {
                signers: [mintKeypair],
            });

            await connection.confirmTransaction(signature, 'confirmed');
            alert(`Token created successfully! Signature: ${signature}`);
        } catch (error) {
            console.error("Token creation failed", error);
            alert(`Token creation failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = !name || !symbol || !imageUrl || !amount || isLoading;

    return (
        <div className="launchpad-container">
            <h1 className="launchpad-title">Token Launchpad</h1>
            <Input id="name" label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <Input id="symbol" label="Symbol" type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
            <Input id="imageUrl" label="Image URL" type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <Input id="amount" label="Initial Supply" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button onClick={createToken} className="create-button" disabled={isButtonDisabled}>
                {isLoading ? 'Creating Token...' : 'Create Token'}
            </button>
        </div>
    );
}
