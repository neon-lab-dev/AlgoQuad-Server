import { Model, ObjectId } from "mongoose";

export type TEmploymentType = "Full-time" | "Part-time" | "Internship";
export type TJobStatus = "Active" | "Closed" | "Draft";

export type TJob = {
  _id?: ObjectId;
  title: string;
  department: string;
  openings: number;
  description: string;
  skills: string[];
  location: string;
  employmentType: TEmploymentType;
  status: TJobStatus;
  responsibilities: string[];
  qualifications: string[];
  perks: string[];
  applications: ObjectId[];
  addedBy: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface JobModel extends Model<TJob> {}