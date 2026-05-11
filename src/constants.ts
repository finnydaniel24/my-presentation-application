/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  name: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  members: string[];
}

export const TEAMS: Team[] = [
  { id: 'T1', name: 'Team 1', members: ['KONJETI Surya Hanuman', 'KAKANI Finny Daniel'] },
  { id: 'T2', name: 'Team 2', members: ['PEDDAPUDI Naveen Kumar', 'BALAJI Rishitha'] },
  { id: 'T3', name: 'Team 3', members: ['CHAKKA Yaspal Venkata Sriram', 'VADLA Nandini'] },
  { id: 'T4', name: 'Team 4', members: ['PATAN Mohammad Adnan Khan', 'SIVANANDAM Devanand'] },
  { id: 'T5', name: 'Team 5', members: ['VELUMURUGAN Sriram'] },
  { id: 'T6', name: 'Team 6', members: ['MARUTURI Leela Venkata Sai Nikhil'] },
];

export const STUDENTS: Student[] = TEAMS.flatMap(t => 
  t.members.map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    teamId: t.id
  }))
);

export type EvaluationCategories = 'content' | 'clarity' | 'delivery' | 'visuals' | 'teamwork' | 'timeManagement';

export interface Evaluation {
  id: string;
  evaluatorId: string;
  evaluatedTeamId: string;
  scores: Record<EvaluationCategories, number | null>;
  comments: string;
  updatedAt: number;
}
