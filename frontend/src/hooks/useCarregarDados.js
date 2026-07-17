/**
 * HOOK REUTILIZÁVEL - Carregamento de dados com cache
 * Reduz duplicação de código entre Dashboard, Agenda, Precos, etc
 */

import { useState, useEffect } from 'react';
import axios from 'axios';

export const useCarregarDados = (url, deps = []) => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro(null);
      const { data } = await axios.get(url);
      setDados(data);
    } catch (err) {
      console.error('Erro ao carregar:', err);
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [url, ...deps]);

  return { dados, loading, erro, recarregar: carregar };
};

/**
 * HOOK - Carregamento com intervalo automático
 * Útil para Dashboard e páginas que precisam atualizar em tempo real
 */
export const useCarregarDadosComIntervalo = (url, intervalo = 5000, deps = []) => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      const { data } = await axios.get(url);
      setDados(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    const intervaloId = setInterval(carregar, intervalo);
    return () => clearInterval(intervaloId);
  }, [url, intervalo, ...deps]);

  return { dados, loading, recarregar: carregar };
};

/**
 * HOOK - Para fazer POST/PUT/DELETE com retorno
 */
export const useApi = () => {
  const fazer = async (method, url, data = null) => {
    try {
      const config = { method, url };
      if (data) config.data = data;
      
      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.error || err.message 
      };
    }
  };

  return { fazer };
};
