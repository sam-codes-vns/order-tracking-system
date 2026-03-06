import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from '../api/axios';

const OrderContext = createContext(null);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/orders/my-orders');
      setOrders(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/orders/all');
      setOrders(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/orders/${orderId}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const placeOrder = useCallback(async (items, agentId = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/orders', { items, agentId });
      setOrders((prev) => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    setError(null);
    try {
      const res = await axios.patch(`/api/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? res.data : o))
      );
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
      throw err;
    }
  }, []);

  const assignAgent = useCallback(async (agentId, orderId) => {
    setError(null);
    try {
      const res = await axios.patch(`/api/agents/${agentId}/assign`, { orderId });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? res.data : o))
      );
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign agent');
      throw err;
    }
  }, []);

  const value = {
    orders,
    loading,
    error,
    fetchMyOrders,
    fetchAllOrders,
    fetchOrder,
    placeOrder,
    updateOrderStatus,
    assignAgent,
    clearError: () => setError(null)
  };

  return React.createElement(OrderContext.Provider, { value: value }, children);
};
