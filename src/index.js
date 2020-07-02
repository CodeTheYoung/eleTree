import groupVnode from '~/vnode/groupVnode'
import documentEvent from '~/event/documentEvent'
import { showLoding, removeLoding } from '~/vnode/loadingVnode'
import { renderData } from '~/opera/renderData'
import methods from '~/methods/index'
import '~/index.scss'
import { eleTreeConfig, symbolAttr } from '~/config'
import { init } from 'snabbdom'
import ajax from '~/opera/ajax'
import { isFun, isArray } from '~/opera/tools'
var patch = init([
    require('snabbdom/modules/class').default,
    require('snabbdom/modules/props').default,
    require('snabbdom/modules/style').default,
    require('snabbdom/modules/eventlisteners').default,
]);

class thisTree {
    constructor(opts) {
        documentEvent.call(this)
        this.node = null            // 保存当前整个虚拟dom树（为了之后的替换）
        this.activeElm = null       // 保存上一次点击的dom节点（高亮显示）
        this.rightMenuCdata = null      // 当前右键时保存当前节点的数据
        this.rightMenuCdom = null      // 当前右键时保存当前节点的dom
        this.rightMenuPasteData = null      // 右键复制之后剪贴板中保存的数据
        this.rightMenuNode = null      // 右键菜单的虚拟dom（为了之后的替换）
        this.isShowRightMenu = false      // 是否显示右键菜单
        this.customIndex = 2020      // 自定义索引，保证不重复
        this.eventList = []        // 事件列表
        this.config = eleTreeConfig
        this.init(opts)
    }
    init(opts, type) {
        this.config = Object.assign({}, this.config, opts)
        let rootEl = document.querySelector(this.config.el)
        if(window.getComputedStyle && window.getComputedStyle(rootEl).position === 'static'){
            rootEl.style.position = 'relative'
        }
        if(this.config.url){
            this.asyncData().then(data=>{
                this.config.data = data
                this.render(type)
            })
        }else if(isArray(this.config.data)){
            this.render(type)
        }else{
            throw '没有url参数或data数据不为数组，请检查数据'
        }
    }
    render(type) {
        renderData.call(this, true)
        // 判断重载
        if(type === 'reload'){
            let oldVnode = this.node;
            patch(oldVnode, groupVnode.call(this, this.config.data, true, true))
        }else{
            let el = document.createElement('div')
            document.querySelector(this.config.el).appendChild(el)
            patch(el, groupVnode.call(this, this.config.data, true, true))
        }
        isFun(this.config.done) && this.config.done(this.config.data)
    }
    async asyncData() {
        showLoding.call(this)
        let data = await ajax({
            method: this.config.method || 'get',
            url: this.config.url,
            data: this.config.where || {},
            headers: this.config.headers
        })
        removeLoding.call(this)
        let response = this.config.response
        if(data[response['statusName']] !== response['statusCode']) throw data.msg
        return data[response['dataName']]    
    }
    reload(opts) {
        this.init(opts, 'reload')
    }
}

const eleTree = (opts) => methods.call(new thisTree(opts))

export default eleTree