import RuleService from 'services/RuleService';
import StorageService from 'services/StorageService';
import BSService from 'services/BrowserSupportService';
import handleError from './errorHandler';
import { PostMessageAction } from 'models/postMessageActionModel';
import { IRuleData, PageType } from 'src/models/formFieldModel';
import { NAMESPACE } from 'src/models/contants';
import { StorageItemType, StorageKey } from 'src/models/storageModel';
import 'services/WebRequestService';
import 'services/InjectFileService';
import Rule = chrome.declarativeNetRequest.Rule;

class ServiceWorker {
  constructor() {
    this.registerListener();
  };

  registerListener(): void {
    chrome.runtime.onInstalled.addListener(this.onInstalled);
    chrome.runtime.onMessage.addListener(this.onMessage);
    chrome.tabs.onUpdated.addListener(this.onUpdatedTab);
  };

  onInstalled = async () => {
    // Temproary function
    // Remove old rules;
    const isCleared = (await StorageService.get(StorageKey.IS_CLEAR))[StorageKey.IS_CLEAR];
    if(chrome.runtime.getManifest().version < '1.0.14' && !isCleared) {
      await this.deleteRules();
      await StorageService.set({[StorageKey.IS_CLEAR]: true});
      await StorageService.set({[StorageKey.NEXT_ID]: 1});
    }
    // Temproary function
    // Add new property to old rules and make by default enabled
    const rules: IRuleData[] = await this.getStorageRules();
    rules.forEach(async (rule) => {
      if(typeof rule.type === 'undefined' && rule.pageType) {
        rule.type = StorageItemType.RULE
      }
      if(typeof rule.enabled === 'undefined') {
        rule.enabled = true
        await StorageService.set({[String(rule.id)]: rule})
      }
    });
  }

  onUpdatedTab = async(tabId, _, tab): Promise<void> => {
    if(BSService.isSupportScriptting()){
      if (
        tab.url?.startsWith("chrome://") ||
        tab.url?.startsWith('chrome-extension') ||
        tab.url?.startsWith('https://chrome.google.com')) return;
      const rules: any = await this.getStorageRulesByProperty({property: 'pageType', value: PageType.MODIFY_REQUEST_BODY});
      chrome.scripting.executeScript({
        target : {tabId},
        func: (rules, NAMESPACE) => {
          window[NAMESPACE as string].rules = rules.filter(rule => rule.enabled);
          window[NAMESPACE as string]?.start();
        },
        world: 'MAIN',
        args: [rules, NAMESPACE],
        // @ts-ignore
        injectImmediately: true,
      }).catch(() => {
        // should be tracking here
      });
    }
  }

  onMessage = (request, _, sendResponse): boolean => {
    const { action, data } = request;
    (async () => {
      let responseData: any;
      try {
        if(action === PostMessageAction.GetStorageRules) {
          responseData = this.getStorageRules();
        } else if(action === PostMessageAction.GetRuleById) {
          responseData = this.getRuleById(data);
        } else if(action === PostMessageAction.AddRule) {
          responseData = this.addRule(data);
        } else if(action === PostMessageAction.UpdateRule) {
          responseData = this.updateRule(data);
        } else if(action === PostMessageAction.DeleteRules) {
          responseData = this.deleteRules();
        } else if(action === PostMessageAction.DeleteRuleById) {
          responseData = this.deleteRuleById(data);
        } else if(action === PostMessageAction.GetUserId) {
          responseData = this.getUserId();
        } else if(action === PostMessageAction.ChangeRuleStatusById) {
          responseData = this.changeRuleStatus(data);
        }
        sendResponse(await responseData);
      } catch (error) {
        sendResponse({error: true, info: handleError(error, {action: PostMessageAction[action], data: request.data})})
      }
    })();
    return true;
  };

  async getRuleById(data): Promise<any> {
    const rule: Rule = await RuleService.getRuleById(data.id);
    const ruleData = await StorageService.get(String(data.id));
    return {rule, ruleData: ruleData[data.id]};
  }

  async addRule(data): Promise<void> {
    const id: number = await StorageService.generateNextId();
    if(data.rule) {
      await RuleService.set([{id, ...data.rule}]);
    }
    await StorageService.set({[id]: { ...data.ruleData, id }});
    await StorageService.set({[StorageKey.NEXT_ID]: id});
  }
  
  async updateRule(data): Promise<void> {
    if(data.rule) {
      await RuleService.set([data.rule], [data.rule])
    }
    await StorageService.set({[data.ruleData.id]: data.ruleData});
  }

  async getStorageRules(): Promise<IRuleData[]> {
    return await StorageService.getRules();
  }

  async getStorageRulesByProperty({ property, value }): Promise<{ [key: string]: any}> {
    const rules: IRuleData[] = await StorageService.getRules();
    return rules.filter((rule) => rule[property] === value);
  }

  async deleteRules(): Promise<void> {
    await RuleService.remove(await RuleService.get());
    await StorageService.remove(await StorageService.getRules());
  }

  async deleteRuleById(data): Promise<void> {
    await RuleService.removeById(data.id);
    await StorageService.removeById(String(data.id))
  }

  async getUserId(): Promise<any> {
    return await StorageService.getUserId();
  }

  async changeRuleStatus({ id, checked }): Promise<void> {
    const ruleData = (await StorageService.get(String(id)))[id];
    ruleData.enabled = checked;
    if(checked) {
      if(ruleData.pageType !== PageType.MODIFY_REQUEST_BODY) {
        await RuleService.set([ruleData.rule]);
      }
      await StorageService.set({[id]: ruleData})
      return;
    }
    const rule = await RuleService.getRuleById(id);
    ruleData.rule = rule;
    await RuleService.removeById(id);
    await StorageService.set({[id]: ruleData})  
  }
}

new ServiceWorker();