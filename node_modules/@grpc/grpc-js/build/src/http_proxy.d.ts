/// <reference types="node" />
import { Socket } from 'net';
import { SubchannelAddress } from './subchannel';
import { ChannelOptions } from './channel-options';
export interface ProxyMapResult {
    target: string;
    extraOptions: ChannelOptions;
}
export declare function mapProxyName(target: string, options: ChannelOptions): ProxyMapResult;
export interface ProxyConnectionResult {
    socket?: Socket;
    realTarget?: string;
}
export declare function getProxiedConnection(address: SubchannelAddress, channelOptions: ChannelOptions): Promise<ProxyConnectionResult>;
