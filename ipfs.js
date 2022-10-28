import * as  IPFS from 'ipfs-core'

const main = async () => {
    const ipfs = await IPFS.create();
    await ipfs.swarm.connect('');
    
}

main()