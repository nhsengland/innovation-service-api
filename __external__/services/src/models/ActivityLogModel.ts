export interface ActivityLogModel {
    date: Date;
    type: string;
    activity: string;
    innovation: { id: string, name: string };
    params?: { [key: string]: string };
}
