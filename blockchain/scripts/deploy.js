const { ethers, network } = require( "hardhat" );

async function controlMining( start ) {
    await network.provider.send( start ? "miner_start" : "miner_stop" );
}

async function mineBlock() {
    await network.provider.send( "evm_mine" );
}

async function main() {
    const [ deployer ] = await ethers.getSigners();
    console.log( "Deploying contracts with account:", deployer.address );

    // Stop mining before deployments
    await controlMining( false );

    // Deploy both contracts without waiting
    const TodoList = await ethers.getContractFactory( "TodoList" );
    const todoList = await TodoList.deploy();
    console.log( "TodoList deployment transaction submitted" );

    const Voting = await ethers.getContractFactory( "Voting" );
    const votingDeploy = await Voting.deploy();
    console.log( "Voting deployment transaction submitted" );

    // Mine single block with both deployments
    await mineBlock();

    // Now wait for confirmations
    await todoList.waitForDeployment();
    await votingDeploy.waitForDeployment();

    console.log( "TodoList deployed to:", await todoList.getAddress() );
    console.log( "Voting deployed to:", await votingDeploy.getAddress() );

    // Re-enable mining
    await controlMining( true );
}

main()
    .then( () => process.exit( 0 ) )
    .catch( ( error ) => {
        console.error( error );
        process.exit( 1 );
    } );