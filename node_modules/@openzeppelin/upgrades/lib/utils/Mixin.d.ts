declare type Constructable<T = {}> = new (...args: any[]) => T;
export declare type Callable<T = any> = (...args: any[]) => T;
export declare type AbstractType<T = {}> = () => void & {
    prototype: T;
};
export declare type GetMixinType<T extends Callable> = InstanceType<ReturnType<T>>;
export default Constructable;
