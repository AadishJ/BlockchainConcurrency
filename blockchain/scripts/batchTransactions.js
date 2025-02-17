const { ethers, network } = require( "hardhat" );

async function controlMining( start ) {
    await network.provider.send( start ? "miner_start" : "miner_stop" );
}

async function mineBlock() {
    await network.provider.send( "evm_mine" );
}

async function main() {
    const [ deployer ] = await ethers.getSigners();
    console.log( "Starting batch transactions with account:", deployer.address );

    // Connect to deployed TodoList contract
    const todoListAddress = "0x35E9B575f5275B95e21B32612E41055c4beE02a2";
    const TodoList = await ethers.getContractFactory( "TodoList" );
    const todoList = TodoList.attach( todoListAddress );

    // Stop auto-mining
    await controlMining( false );

    // Submit 20 transactions without waiting
    const transactions = [];
    for ( let i = 0; i < 20; i++ ) {
        const tx = await todoList.createTask( `Task ${ i }` );
        transactions.push( tx );
        console.log( `Transaction ${ i + 1 } submitted` );
    }

    // Mine single block with all transactions
    await mineBlock();

    // Wait for all transactions
    await Promise.all( transactions.map( tx => tx.wait() ) );
    console.log( "All 20 transactions mined in single block" );

    // Re-enable mining
    await controlMining( true );
}

main()
    .then( () => process.exit( 0 ) )
    .catch( ( error ) => {
        console.error( error );
        process.exit( 1 );
    } );