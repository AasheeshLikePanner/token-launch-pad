import { createInitializeMetadataPointerInstruction, createInitializeMintInstruction, ExtensionType, getMintLen, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { createInitializeInstruction, pack } from '@solana/spl-token-2022';
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
