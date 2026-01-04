import { useState, useEffect, useCallback } from 'react';
import { CoinData } from '../types';
import { getTopCoins, getCoinDetails } from '../services/coingeckoService';

export const useMarketData = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingCoin, setIsAddingCoin] = useState(false);
  const [activeCoinIds, setActiveCoinIds] = useState<string[]>([]);

  // Initial Load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
          const savedIdsStr = localStorage.getItem('cryptoView_ids');
          let idsToFetch: string[] = [];
          if (savedIdsStr) {
            try { idsToFetch = JSON.parse(savedIdsStr); } catch (e) {}
          }

          if (idsToFetch.length > 0) {
              const savedCoins = await getCoinDetails(idsToFetch);
              setCoins(savedCoins);
              setActiveCoinIds(savedCoins.map(c => c.id));
          } else {
              const topCoins = await getTopCoins(10);
              setCoins(topCoins);
              setActiveCoinIds(topCoins.map(c => c.id));
          }
      } catch (error) {
          console.error("Failed to fetch market data", error);
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync IDs to LocalStorage
  useEffect(() => {
      if (activeCoinIds.length > 0) {
          localStorage.setItem('cryptoView_ids', JSON.stringify(activeCoinIds));
      }
  }, [activeCoinIds]);

  const addCoin = async (coinId: string) => {
    if (activeCoinIds.includes(coinId)) return;
    
    setIsAddingCoin(true);
    try {
        const newCoinData = await getCoinDetails([coinId]);
        if (newCoinData.length > 0) {
          const coin = newCoinData[0];
          if (!coin.market_cap || coin.market_cap <= 0) { 
             alert(`Cannot add ${coin.name}: Market Cap data is missing or zero.`); 
             return; 
          }
          setCoins(prev => [...prev, coin]);
          setActiveCoinIds(prev => [...prev, coinId]);
        }
    } catch (err) { 
        console.error("Failed to add coin", err); 
    } finally { 
        setIsAddingCoin(false); 
    }
  };

  const refreshMarket = useCallback(async () => {
      setLoading(true);
      try {
         if (activeCoinIds.length > 0) {
            const updatedData = await getCoinDetails(activeCoinIds);
            setCoins(updatedData);
         } else {
            const top = await getTopCoins(10);
            setCoins(top);
         }
      } catch (error) {
          console.error("Failed to refresh market", error);
      } finally {
          setLoading(false);
      }
  }, [activeCoinIds]);

  return {
    coins,
    loading,
    isAddingCoin,
    activeCoinIds,
    addCoin,
    refreshMarket
  };
};