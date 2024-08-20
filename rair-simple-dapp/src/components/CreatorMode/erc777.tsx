import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { faRedo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as ethers from 'ethers';
import { stringToHex } from 'viem';

import { IErc777Data, IERC777Manager } from './creatorMode.types';

import { RootState } from '../../ducks';
import { ColorStoreType } from '../../ducks/colors/colorStore.types';
import { ContractsInitialType } from '../../ducks/contracts/contracts.types';
import useSwal from '../../hooks/useSwal';
import useWeb3Tx from '../../hooks/useWeb3Tx';

const ERC777Manager: React.FC<IERC777Manager> = () => {
  const [erc777Data, setERC777Data] = useState<IErc777Data>();
  const [targetAddress, setTargetAddress] = useState<string>('');
  const [targetValue, setTargetValue] = useState<number>(0);
  const [refetchingFlag, setRefetchingFlag] = useState<boolean>(false);

  const { mainTokenInstance, currentUserAddress } = useSelector<
    RootState,
    ContractsInitialType
  >((state) => state.contractStore);
  const { textColor, secondaryButtonColor } = useSelector<
    RootState,
    ColorStoreType
  >((store) => store.colorStore);

  const reactSwal = useSwal();
  const { web3TxHandler } = useWeb3Tx();

  const refreshData = useCallback(async () => {
    setRefetchingFlag(true);
    setERC777Data({
      balance: (
        await mainTokenInstance?.balanceOf(currentUserAddress)
      ).toString(),
      name: await mainTokenInstance?.name(),
      symbol: await mainTokenInstance?.symbol(),
      decimals: await mainTokenInstance?.decimals()
    });
    setRefetchingFlag(false);
  }, [mainTokenInstance, currentUserAddress]);

  useEffect(() => {
    if (currentUserAddress) {
      refreshData();
    }
  }, [refreshData, currentUserAddress]);

  return (
    <div
      className="col py-4 border border-white rounded"
      style={{ position: 'relative' }}>
      <h5> ERC777 </h5>
      <small>({mainTokenInstance?.address})</small>
      <button
        style={{ position: 'absolute', left: 0, top: 0, color: 'inherit' }}
        onClick={refreshData}
        disabled={refetchingFlag}
        className="btn">
        {refetchingFlag ? '...' : <FontAwesomeIcon icon={faRedo} />}
      </button>
      <br />
      {erc777Data ? (
        <>
          <br />
          {`Your balance on the '${erc777Data.name}' Token: `}
          {ethers.utils.formatEther(erc777Data.balance)} {erc777Data.symbol}{' '}
          <br />
          <hr className="w-100" />
          Transfer Tokens
          <br />
          Transfer to Address:{' '}
          <input
            className="form-control w-75 mx-auto"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
          />
          Amount to Transfer:{' '}
          <input
            className="form-control w-75 mx-auto"
            value={targetValue}
            type="number"
            onChange={(e) => setTargetValue(+e.target.value)}
          />
          <br />
          {String(targetValue) !== '' && targetAddress && (
            <button
              disabled={targetValue <= 0 || targetAddress === ''}
              onClick={async () => {
                if (!mainTokenInstance) {
                  return;
                }
                reactSwal.fire({
                  title: 'Sending tokens',
                  html: 'Please wait',
                  icon: 'info',
                  showConfirmButton: true
                });
                if (
                  await web3TxHandler(mainTokenInstance, 'send', [
                    targetAddress,
                    targetValue,
                    stringToHex('')
                  ])
                ) {
                  reactSwal.fire('Success', 'Tokens sent', 'success');
                }
              }}
              style={{
                background: secondaryButtonColor,
                color: textColor
              }}
              className="btn rair-button">
              Transfer {ethers.utils.formatEther(targetValue).toString()}{' '}
              {erc777Data.symbol} to {targetAddress}!
            </button>
          )}
          <hr className="w-100" />
          {window.ethereum && (
            <button
              className="btn btn-light"
              onClick={() => {
                window.ethereum
                  .request({
                    method: 'metamask_watchAsset',
                    params: {
                      type: 'ERC20', // Initially only supports ERC20, but eventually more!
                      options: {
                        address: mainTokenInstance?.address, // The address that the token is at.
                        symbol: erc777Data.symbol, // A ticker symbol or shorthand, up to 5 chars.
                        decimals: 18 // The number of decimals in the token
                      }
                    }
                  })
                  .then((boolean) =>
                    reactSwal.fire(
                      boolean
                        ? 'ERC777 RAIR Token added'
                        : 'Failed to Add ERC777 RAIR Token'
                    )
                  );
              }}>
              Track {erc777Data.name} Token on Metamask!
            </button>
          )}
        </>
      ) : (
        'Fetching info...'
      )}
    </div>
  );
};

export default ERC777Manager;
