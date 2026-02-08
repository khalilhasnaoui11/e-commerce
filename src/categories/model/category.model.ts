export class Category {
    id: string;
    name: string;
    description: string;
    parentId: string | null;
    productIds: string[];
}