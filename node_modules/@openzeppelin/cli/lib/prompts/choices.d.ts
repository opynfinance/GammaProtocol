export declare type Choice = string | {
    name: string;
    value: string;
    short?: string;
} | {
    type: 'separator';
};
export declare type ContractsSource = 'built' | 'notAdded' | 'added' | 'all';
export declare function contracts(source?: ContractsSource): Choice[];
