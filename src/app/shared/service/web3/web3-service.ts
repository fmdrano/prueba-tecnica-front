import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { BehaviorSubject, Observable } from 'rxjs';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  isConnected: boolean;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
}

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  private provider!: ethers.BrowserProvider;
  private signer!: ethers.Signer;
  private walletSubject = new BehaviorSubject<WalletInfo | null>(null);
  
  // Red principal de Ethereum
  private readonly MAINNET_CONFIG: NetworkConfig = {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/b7f838d3197547809e63e090df5b2101', // API KEY metaMask
    blockExplorer: 'https://etherscan.io'
  };

  public wallet$ = this.walletSubject.asObservable();

  constructor() {
    this.checkConnection();
  }

  /**
   * Verifica si MetaMask está instalado
   */
  private isMetaMaskInstalled(): boolean {
    return typeof (window as any).ethereum !== 'undefined';
  }

  /**
   * Conecta con MetaMask
   */
  async connectWallet(): Promise<WalletInfo | null> {
    try {
      if (!this.isMetaMaskInstalled()) {
        throw new Error('MetaMask no está instalado. Por favor instálalo desde https://metamask.io/');
      }

      // Solicitar acceso a las cuentas
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No se encontraron cuentas en MetaMask');
      }

      // Configurar provider y signer
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      this.signer = await this.provider.getSigner();

      // Verificar que estamos en mainnet
      await this.ensureCorrectNetwork();

      // Obtener información de la wallet
      const walletInfo = await this.getWalletInfo();
      this.walletSubject.next(walletInfo);

      // Configurar listeners para cambios
      this.setupEventListeners();

      return walletInfo;
    } catch (error) {
      console.error('Error al conectar wallet:', error);
      throw error;
    }
  }

  /**
   * Desconecta la wallet
   */
  disconnectWallet(): void {
    this.walletSubject.next(null);
    this.removeEventListeners();
  }

  /**
   * Verifica y cambia a la red principal si es necesario
   */
  private async ensureCorrectNetwork(): Promise<void> {
    const network = await this.provider.getNetwork();
    
    if (Number(network.chainId) !== this.MAINNET_CONFIG.chainId) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${this.MAINNET_CONFIG.chainId.toString(16)}` }]
        });
      } catch (switchError: any) {
        // Error 4902 significa que la red no está agregada a MetaMask
        if (switchError.code === 4902) {
          await this.addMainnetToMetaMask();
        } else {
          throw new Error('Por favor cambia a Ethereum Mainnet en MetaMask');
        }
      }
    }
  }

  /**
   * Agrega la red principal a MetaMask (raramente necesario)
   */
  private async addMainnetToMetaMask(): Promise<void> {
    await (window as any).ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${this.MAINNET_CONFIG.chainId.toString(16)}`,
        chainName: this.MAINNET_CONFIG.name,
        rpcUrls: [this.MAINNET_CONFIG.rpcUrl],
        blockExplorerUrls: [this.MAINNET_CONFIG.blockExplorer],
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18
        }
      }]
    });
  }

  /**
   * Obtiene información actual de la wallet
   */
  private async getWalletInfo(): Promise<WalletInfo> {
    const address = await this.signer.getAddress();
    const balance = await this.provider.getBalance(address);
    const network = await this.provider.getNetwork();

    return {
      address,
      balance: ethers.formatEther(balance),
      chainId: Number(network.chainId),
      isConnected: true
    };
  }

  /**
   * Configura listeners para cambios en MetaMask
   */
  private setupEventListeners(): void {
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      (window as any).ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      (window as any).ethereum.on('disconnect', this.handleDisconnect.bind(this));
    }
  }

  /**
   * Remueve listeners
   */
  private removeEventListeners(): void {
    if ((window as any).ethereum) {
      (window as any).ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      (window as any).ethereum.removeListener('chainChanged', this.handleChainChanged);
      (window as any).ethereum.removeListener('disconnect', this.handleDisconnect);
    }
  }

  /**
   * Maneja cambios de cuenta
   */
  private async handleAccountsChanged(accounts: string[]): Promise<void> {
    if (accounts.length === 0) {
      this.disconnectWallet();
    } else {
      try {
        const walletInfo = await this.getWalletInfo();
        this.walletSubject.next(walletInfo);
      } catch (error) {
        console.error('Error al actualizar información de cuenta:', error);
      }
    }
  }

  /**
   * Maneja cambios de red
   */
  private async handleChainChanged(chainId: string): Promise<void> {
    try {
      // Recargar para evitar problemas de estado
      window.location.reload();
    } catch (error) {
      console.error('Error al cambiar red:', error);
    }
  }

  /**
   * Maneja desconexión
   */
  private handleDisconnect(): void {
    this.disconnectWallet();
  }

  /**
   * Verifica conexión existente al cargar la aplicación
   */
  private async checkConnection(): Promise<void> {
    try {
      if (!this.isMetaMaskInstalled()) return;

      const accounts = await (window as any).ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts.length > 0) {
        await this.connectWallet();
      }
    } catch (error) {
      console.error('Error al verificar conexión existente:', error);
    }
  }

  /**
   * Envía transacción
   */
  async sendTransaction(to: string, value: string): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet no conectada');
      }

      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(value)
      });

      return tx.hash;
    } catch (error) {
      console.error('Error al enviar transacción:', error);
      throw error;
    }
  }

  /**
   * Obtiene el balance actual
   */
  async getCurrentBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet no conectada');
    }

    const address = await this.signer.getAddress();
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Firma un mensaje
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet no conectada');
    }

    return await this.signer.signMessage(message);
  }
}
