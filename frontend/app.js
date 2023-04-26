const API_URL = '/api/drive';
const driveState = Vue.observable({ folderBreadcrumb: [''], items: [] });

function loadDriveItems() {
    return axios
        .get(buildItemUrl())
        .then(response => (driveState.items = response.data))
}

function buildBreadcrumb() {
    return driveState.folderBreadcrumb.join('/') + '/';
}

function buildItemUrl(itemName = '') {
    return API_URL + buildBreadcrumb() + itemName;
}

Vue.component('drive-breadcrumb', {
    template: '<div class="drive-breadcrumb flex-horizontal" title="Current folder">' +
        '<div v-on:click="back" title="Back"><i class="far fa-caret-square-left drive-item-action"></i></div>' +
        '<div class="drive-breadcrumb-text">{{folderBreadcrumb}}</div>' +
        '</div>',
    computed: {
        folderBreadcrumb: () => buildBreadcrumb(driveState.folderBreadcrumb),
    },
    methods: {
        back() {
            driveState.folderBreadcrumb.splice(driveState.folderBreadcrumb.length - 1, 1);
            loadDriveItems();
        },
    },
});

Vue.component('drive-item-folder', {
    template: '<div class="drive-item-folder" title="folder" v-on:click.prevent="open"><i class="far fa-folder"></i>{{item.name}}</div>',
    props: ['item'],
    methods: {
        open() {
            driveState.folderBreadcrumb.push(this.item.name);
            loadDriveItems();
        },
    },
});

Vue.component('drive-item-file', {
    template: `<a class="drive-item-file" title="file" target="_blank" :href="href"><i class="far fa-file"></i>{{item.name}}<span> ({{item.size}} bytes)</span></a>`,
    props: ['item'],
    computed: {
        href() { return buildItemUrl(this.item.name) },
    },

});

Vue.component('drive-item', {
    template: '<li class="drive-item flex-horizontal">' +
        '<div class="drive-item-action alert" v-on:click="del" title="delete"><i class="far fa-trash-alt"></i></div>' +
        '<drive-item-folder v-if="item.isFolder" v-bind:item="item"/>' +
        '<drive-item-file v-if="!item.isFolder" v-bind:item="item"/>' +
        '<div class="msg-error">{{message}}</div>' +
    '</li>',
    props: ['item'],
    data: () => ({
        message: '',
    }),
    methods: {
        del() {
            axios.delete(buildItemUrl(this.item.name))
                .then(() => {
                    this.message = '';
                })
                .then(() => loadDriveItems())
                .catch(error => {
                    this.message = error.response.data;
                });
        },
    },
});

Vue.component('drive-add-file', {
    template: '<div class="drive-add-file">' +
        '<label>' +
            'Upload a new file' +
            '<input type="file" id="file" ref="file" v-on:change="handleFileUpload"/></label>' +
        '<div class="msg-error">{{message}}</div>' +
        '</div>',
    data: () => ({
        message: '',
    }),
    methods: {
        handleFileUpload() {
            const file = this.$refs.file.files[0];
            const formData = new FormData();
            formData.append('file', file);

            axios.put(buildItemUrl(),
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then(() => {
                    this.message = '';
                })
                .then(() => loadDriveItems())
                .catch(error => {
                    this.message = error.response.data;
                });
        }
    },
});

Vue.component('drive-add-folder', {
    template: '<form class="drive-add-folder" v-on:submit.prevent="submit">' +
        '<input v-model.trim="name" placeholder="Create a new folder">' +
        '<span v-on:click="submit"><i class="fa fa-folder-plus"></i></span>' +
        '<div class="msg-error">{{message}}</div>' +
    '</form>',
    data: () => ({
      name: '',
      message: '',
    }),
    methods: {
        submit: function () {
            if (this.name === '') {
                return;
            }
            axios
                .post(buildItemUrl(`?name=${this.name}`))
                .then(() => {
                    this.message = '';
                    this.name = '';
                })
                .then(() => loadDriveItems())
                .catch(error => {
                    this.message = error.response.data;
                })
        },
    },
});

Vue.component('drive', {
    template: '<div>' +
        '<drive-add-file />' +
        '<ul>' +
            '<drive-breadcrumb />' +
            '<drive-add-folder />' +
            '<div class="msg-error">{{message}}</div>' +
            '<drive-item v-for="item in items" :key="item.name" v-bind:item="item"></drive-item>' +
        '</ul>' +
        '</div>',
    data: () => ({
        message: '',
    }),
    computed: {
        items: () => driveState.items,
    },
    mounted () {
        loadDriveItems()
            .then(() => {
                this.message = '';
            })
            .catch(error => {
                this.message = error.response.data;
            });
    }
});

new Vue({
    el: '#app',
    template: '<drive class="app"></drive>'
});
