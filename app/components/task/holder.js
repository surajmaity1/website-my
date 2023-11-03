import Component from '@glimmer/component';
import { action } from '@ember/object';
import { TASK_KEYS, TASK_STATUS_LIST } from 'website-my/constants/tasks';
import { tracked } from '@glimmer/tracking';
import { TASK_PERCENTAGE } from '../../constants/tasks';

export default class TasksHolderComponent extends Component {
  @tracked percentCompleted = this.args.task.percentCompleted;
  @tracked status = this.args.task.status;
  @tracked extensionFormOpened = false;
  @tracked isLoading = false;
  queryParams = ['dev'];

  TASK_KEYS = TASK_KEYS;
  availabletaskStatusList = TASK_STATUS_LIST;

  get taskStatusList() {
    const statusToDisplay = this.availabletaskStatusList.filter(
      (taskStatus) => {
        if (this.args.dev === true) {
          return taskStatus.key !== 'ALL' && taskStatus.key !== 'COMPLETED';
        } else {
          return taskStatus.key !== 'ALL' && taskStatus.key !== 'DONE';
        }
      }
    );
    return statusToDisplay;
  }

  get removedTaskStatus() {
    const statusToDisplay = this.availabletaskStatusList.filter(
      (taskStatus) => {
        if (this.args.dev === true) {
          if (
            taskStatus.key !== TASK_KEYS.ALL &&
            taskStatus.key !== TASK_KEYS.VERIFIED &&
            taskStatus.key !== TASK_KEYS.RELEASED &&
            taskStatus.key !== TASK_KEYS.REGRESSION_CHECK &&
            taskStatus.key !== TASK_KEYS.SANITY_CHECK &&
            taskStatus.key !== TASK_KEYS.APPROVED &&
            taskStatus.key !== TASK_KEYS.SMOKE_TESTING &&
            taskStatus.key !== TASK_KEYS.COMPLETED &&
            taskStatus.key !== TASK_KEYS.NEEDS_REVIEW
          ) {
            return true;
          } else {
            return false;
          }
        } else {
          return taskStatus;
        }
      }
    );
    return statusToDisplay;
  }

  get taskStyleClass() {
    const statusNotOverDueList = [
      this.args.dev === true ? TASK_KEYS.DONE : TASK_KEYS.COMPLETED,
      TASK_KEYS.VERIFIED,
      TASK_KEYS.AVAILABLE,
    ];
    if (
      this.args.task.endsOn * 1000 < Date.now() &&
      !statusNotOverDueList.includes(this.args.task.status)
    ) {
      return 'task-late';
    } else return '';
  }

  get progressBarClass() {
    const startDate = this.args.task.startedOn * 1000;
    const endDate = this.args.task.endsOn * 1000;
    if (!startDate || !endDate) {
      return 'progress-bar-yellow';
    }
    // It provides us with total days that are there for the the project and number of days left
    const totalDays = endDate - startDate;

    const daysLeft = endDate - Date.now();

    let percentageOfDaysLeft = 0;
    if (daysLeft > 0) {
      percentageOfDaysLeft = (daysLeft / totalDays) * 100;
    }

    const percentIncomplete = 100 - this.percentCompleted;

    if (
      this.percentCompleted === 100 ||
      percentageOfDaysLeft >= percentIncomplete
    ) {
      return 'progress-bar-green';
    }

    if (
      (percentageOfDaysLeft < 25 && percentIncomplete > 35) ||
      (percentageOfDaysLeft <= 0 && percentIncomplete > 0)
    ) {
      return 'progress-bar-red';
    }

    if (percentageOfDaysLeft < 50 && percentIncomplete > 75) {
      return 'progress-bar-orange';
    }

    return 'progress-bar-yellow';
  }

  @action progressBarInputChange(value) {
    this.percentCompleted = value;
  }

  get isProgressBarDisabled() {
    return this.args.task.status !== TASK_KEYS.IN_PROGRESS;
  }

  @action
  async onPercentageChange(e) {
    const { value } = e.target;
    this.percentCompleted = value;
    this.args.onTaskChange('percentCompleted', value);
    if (value === TASK_PERCENTAGE.completedPercentage) {
      this.percentCompleted = this.args.task.percentCompleted;
    }
    await this.onUpdate(this.args.task.id);
  }

  @action
  async onUpdate(taskId) {
    this.isLoading = true;
    await this.args.onTaskUpdate(taskId, () => {
      this.percentCompleted = this.args.task.percentCompleted;
      this.status = this.args.task.status;
    });
    this.isLoading = false;
  }

  @action
  onStatusChange(e) {
    const { value } = e.target;
    this.status = value;
    this.args.onTaskChange('status', value);
    this.onUpdate(this.args.task.id);
  }

  @action
  toggleExtensionForm() {
    this.extensionFormOpened = !this.extensionFormOpened;
  }

  @action
  closeExtensionForm() {
    this.extensionFormOpened = false;
  }

  @action
  closeExtensionModel(e) {
    if (!e) {
      this.toggleExtensionForm(e);
      return;
    }
    e.stopPropagation();
    if (e.target.classList.contains('extension-form__container-back')) {
      this.toggleExtensionForm(e);
    }
  }
}
