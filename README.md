# ROYALTY TRACKER

This program aims to allow users to verifiably pay a secondary NFT purchase's royalty.

Users interact with the create_receipt function to create an on-chain receipt that holds information about the payment information (listing signature and payment signature).
Users then interact with the pay_royalty function to actually pay the remaining amount of royalty on an NFT, and record that data on chain.


## create_receipt

This function allocates space on chain corresponding to a user paying a royalty. This account will store useful information like the signature of the payment etc.

## pay_royalty

This function take in user input, including:
- nft traded price
- royalty percent already paid
- the listing signature
- original payment signature

The function takes in accounts including the coressponding receipt address, the nft mint and metadata, and the creator accounts (verified against the information in the metadata account).

The information is all validated, and the remaining amount of SOL royalty needed to be paid is calculated and indeed paid out appropriately. This information is all finally written to the receipt, effectively granting the ability to see if and when/where a royalty has been paid.


## Drawbacks

The contract relies on users being truthful with the information they provide to the pay_royalty function, namely the nft traded price, and the royalty percent already paid.

This information can be verified off chain, but at the moment, there is a trade-off where a centralized actor is needed to verify paid royalties.

## TODOs
- Design more usecases like all available receipts for a collection, for a specific nft, etc
- Review unimplied security checks in code