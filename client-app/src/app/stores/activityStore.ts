import {observable, action, computed, runInAction} from 'mobx';
import { SyntheticEvent } from 'react';
import { IActivity } from '../models/activity';
import agent from '../api/agent'
import {history} from '../..'
import { toast } from 'react-toastify';
import { RootStore } from './RootStore';

export default class ActivityStore {
    rootStore: RootStore
    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @observable activityRegistry = new Map();
    @observable activity: IActivity | null = null;
    @observable loadingInitial = false;
    @observable submitting = false;
    @observable target = '';

    @computed get activitiesByDate() {
        return this.groupActivitiesByDate(Array.from(this.activityRegistry.values()));
    }

    groupActivitiesByDate(activities: IActivity[]) {
        const sortedActivities = activities.sort(
            (a, b) => a.date.getTime() - b.date.getTime()
        )
        return Object.entries(sortedActivities.reduce((activities, activity) => {
            const date = activity.date.toISOString().split('T')[0];
            activities[date] = activities[date] ? [...activities[date], activity] : [activity];
            return activities;
        }, {} as {[key: string]: IActivity[]}));
    }

    @action loadActivities = async () => {
        this.loadingInitial = true;
        try {
            const activities = await agent.Activities.list()
            runInAction('loading activities', () => {
                activities.forEach((activity) => {
                    activity.date = new Date(activity.date);
                    this.activityRegistry.set(activity.id, activity);
              })
              this.loadingInitial = false;
            }) 
        } catch (error) {
            runInAction('loading activities error', () => {
                console.log(error);
                this.loadingInitial = false
            })
        }
    }

    @action clearActivity = () => {
        this.activity = null;
    }
    
    @action loadActivity = async (id: string) => {
        let activity = this.getActivity(id);
        if (activity) {
            this.activity = activity;
            return activity
        } else {
            this.loadingInitial = true;
            try {
                activity = await agent.Activities.details(id);
                runInAction('getting activity', () => {
                    activity.date = new Date(activity.date)
                    this.activity = activity;
                    this.activityRegistry.set(activity.id, activity);
                    this.loadingInitial = false;
                })
                return activity
            } catch (error) {
                runInAction('get activity error',() => {
                    this.loadingInitial = false;
                })
                console.log(error)
            }
        }
    }

    getActivity = (id: string) => {
        return this.activityRegistry.get(id);
    }

    @action createActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.create(activity);
            runInAction('creating an activity', () => {
                this.activityRegistry.set(activity.id, activity);
                this.submitting = false
            })
            history.push(`/activities/${activity.id}`)
        } catch (error) {
            runInAction('creating an activity error', () => {
                this.submitting = false
                console.log(error.response)
            })
            toast.error('Problem Submitting data')
        }
    }

    @action deleteActivity = async (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
        this.submitting = true;
        this.target = event.currentTarget.name;
        try {
            await agent.Activities.delete(id);
            runInAction('deleting an activity', () => {
                this.activityRegistry.delete(id);
                this.submitting = false;
                this.target = '';
            })
        } catch (error) {
            runInAction('error while deleting an activity',() => {
                this.submitting = false;
                this.target = '';
                console.log(error);
            })
        }
    }

    @action editActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.update(activity);
            runInAction('editing an activity',() => {
                this.activityRegistry.set(activity.id, activity);
                this.activity = activity;
                this.submitting = false;
            })
            history.push(`/activities/${activity.id}`)
        } catch (error) {
            runInAction('error while editing activity',() => {
                this.submitting = false;
                console.log(error.response);
            })
            toast.error('Problem Submitting data')
        }
    }

    @action selectActivity = (id: string) => {
        this.activity = this.activityRegistry.get(id);
    }
}

