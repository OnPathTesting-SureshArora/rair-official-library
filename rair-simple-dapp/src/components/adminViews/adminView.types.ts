import { TTokenData } from '../../axios.responseTypes';

export type NativeCurrencyType = {
  name: string;
  symbol: string;
  decimals: number;
};

export type ChainDataType = {
  chainId?: BlockchainType;
  chainName: string;
  nativeCurrency?: NativeCurrencyType;
  rpcUrls?: string[];
  blockExplorerUrls?: string[];
};

export type BlockchainInfo = {
  chainData: ChainDataType;
  bootstrapColor: string;
};

export type MetamaskError = {
  code: number;
  message: string;
};

export type ContractsResponseType = {
  contracts: ContractType[];
  success: boolean;
};

type ContractInfo = {
  title: string;
  contractAddress: string;
};

export type ContractType = {
  diamond: boolean;
  _id: string;
  title: string;
  blockchain: BlockchainType;
  contractAddress: string;
  external?: boolean;
};

export type ContractDataType = ContractInfo | ContractType | undefined;

export type NFTSelectedNumberResponseType = {
  success: boolean;
  result: {
    totalCount: number;
    tokens: TTokenData[];
  };
};

export type TContractSchema = {
  blockchain: BlockchainType;
  contractAddress: string;
  diamond: boolean;
  title: string;
  _id: string;
  creationDate: string;
  external: boolean;
  lastSyncedBlock: string;
  user: string;
};

export type TExternalContractType = {
  contract: TContractSchema;
  numberOfTokensAdded: number;
};

export type Settings = {
  demoUploadsEnabled?: Boolean;
  onlyMintedTokensResult?: Boolean;
  nodeAddress?: String;
  featuredCollection?: any;
  superAdminsOnVault?: Boolean;
  favicon?: string;
  databaseResales?: Boolean;
};

export type BlockchainSetting = {
  hash?: BlockchainType;
  display?: Boolean;
  sync?: Boolean;
  name?: string;

  diamondFactoryAddress?: string;
  classicFactoryAddress?: string;
  diamondMarketplaceAddress?: string;
  licenseExchangeAddress?: string;
  mainTokenAddress?: string;
  rpcEndpoint?: string;
  blockExplorerGateway?: string;
  numericalId?: number;
  testnet?: Boolean;
  symbol?: string;

  _id?: string;
  isNew?: boolean;

  image?: string;
};
