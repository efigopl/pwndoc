import { Dialog, Notify, QSpinnerGears } from 'quasar';

import AuditStateIcon from 'components/audit-state-icon'
import Breadcrumb from 'components/breadcrumb'

import AuditService from '@/services/audit'
import DataService from '@/services/data'
import CompanyService from '@/services/company'
import UserService from '@/services/user'

import { $t } from '@/boot/i18n'

export default {
    data: () => {
        return {
            UserService: UserService,
            // Audits list
            audits: [],
            // Loading state
            loading: true,
            // AuditTypes list
            auditTypes: [],
            // Companies list
            companies: [],
            // Languages availbable
            languages: [],
            // Datatable headers
            dtHeaders: [
                {name: 'name', label: $t('name'), field: 'name', align: 'left', sortable: true},
                {name: 'auditType', label: $t('auditType'), field: 'auditType', align: 'left', sortable: true},
                {name: 'language', label: $t('language'), field: 'language', align: 'left', sortable: true},
                {name: 'company', label: $t('company'), field: row => (row.company)?row.company.name:'', align: 'left', sortable: true},
                {name: 'users', label: $t('participants'), align: 'left', sortable: true},
                {name: 'date', label: $t('date'), field: row => row.createdAt.split('T')[0], align: 'left', sortable: true},
                {name: 'connected', label: '', align: 'left', sortable: false},
                {name: 'reviews', label: '', align: 'left', sortable: false},
                {name: 'action', label: '', field: 'action', align: 'left', sortable: false},
            ],
            visibleColumns: ['name', 'auditType', 'language', 'company', 'users', 'date', 'action'],
            // Datatable pagination
            pagination: {
                page: 1,
                rowsPerPage: 25,
                sortBy: 'date',
                descending: true
            },
            rowsPerPageOptions: [
                {label:'25', value:25},
                {label:'50', value:50},
                {label:'100', value:100},
                {label:'All', value:0}
            ],
            // Search filter
            search: {finding: '', auditType: '', name: '', language: '', company: '', users: '', date: ''},
            myAudits: false,
            displayConnected: false,
            displayReadyForReview: false,
            // Errors messages
            errors: {name: '', language: '', auditType: ''},
            // Selected or New Audit
            currentAudit: {name: '', language: '', auditType: '', type: 'default'}
        
        }
    },

    components: {
        AuditStateIcon,
        Breadcrumb
    },

    mounted: function() {
        this.search.finding = this.$route.params.finding;

        if (this.UserService.isAllowed('audits:users-connected'))
            this.visibleColumns.push('connected')
        if (this.$settings.reviews.enabled)
            this.visibleColumns.push('reviews')

        this.getAudits();
        this.getLanguages();
        this.getAuditTypes();
        this.getCompanies();
    },

    computed: {
        modalAuditTypes: function() {
            return this.auditTypes.filter(type => type.stage === this.currentAudit.type)
        }
    },

    methods: {
        getLanguages: function() {
            DataService.getLanguages()
            .then((data) => {
                this.languages = data.data.datas;
            })
            .catch((err) => {
                console.log(err)
            })
        },

        getAuditTypes: function() {
            DataService.getAuditTypes()
            .then((data) => {
                this.auditTypes = data.data.datas
            })
            .catch((err) => {
                console.log(err)
            })
        },

         // Companies list
         getCompanies: function() {
            CompanyService.getCompanies()
            .then((data) => {
                this.companies = data.data.datas;
            })
            .catch((err) => {
                console.log(err)
            })
        },

        getAudits: function() {
            this.loading = true
            AuditService.getAudits({findingTitle: this.search.finding})
            .then((data) => {
                this.audits = data.data.datas
                this.loading = false
            })
            .catch((err) => {
                console.log(err)
            })
        },

        createAudit: function() {
            this.cleanErrors();
            if (!this.currentAudit.name){
                this.errors.name = "Name required";
            }
            if (!this.currentAudit.language){
                this.errors.language = "Language required";
            }
            if (!this.currentAudit.auditType){
                this.errors.auditType = "Assessment required";
            }
                
            if (this.errors.name || this.errors.language || this.errors.auditType){
                return;
            }

            AuditService.createAudit(this.currentAudit)
            .then((response) => {
                this.$refs.createModal.hide();
                this.$router.push("/audits/" + response.data.datas.audit._id)
            })
            .catch((err) => {
                Notify.create({
                    message: err.response.data.datas,
                    color: 'negative',
                    textColor:'white',
                    position: 'top-right'
                })
            })
        },

        importCreateAudit: function (jsonData) {

            const auditData = jsonData.datas;

            const newAudit = {
                name: auditData.name,
                auditType: auditData.auditType,
                language: auditData.language,
                template: auditData.template ? auditData.template._id : null,
                creator: auditData.creator ? auditData.creator._id : null,
                state: auditData.state,
                type: auditData.type || "default",
                date: auditData.date,
                date_start: auditData.date_start,
                date_end: auditData.date_end,
                customFields: auditData.customFields || [],
                sections: auditData.sections || [],
                collaborators: auditData.collaborators || [],
                reviewers: auditData.reviewers || [],
                sortFindings: auditData.sortFindings || [],
                scope: auditData.scope || [],
                findings: auditData.findings || [],
                client: auditData.client ? auditData.client._id : null,
                company: auditData.company ? auditData.company._id : null,
            };

            AuditService.createAudit(newAudit)
                .then((response) => {
                    console.log("Audit imported and created successfully:", response.data);
                    this.$router.push("/audits/" + response.data.datas.audit._id);
                    Notify.create({
                        message: 'Audit imported successfully',
                        color: 'positive',
                        textColor: 'white',
                        position: 'top-right'
                    });
                })
                .catch((err) => {
                    console.error("Error creating audit:", err); 
                    Notify.create({
                        message: err.response.data.datas || 'Error creating audit',
                        color: 'negative',
                        textColor: 'white',
                        position: 'top-right'
                    });
                });
        },
        

        deleteAudit: function(uuid) {
            AuditService.deleteAudit(uuid)
            .then(() => {
                this.getAudits();
                Notify.create({
                    message: 'Audit deleted successfully',
                    color: 'positive',
                    textColor:'white',
                    position: 'top-right'
                })
            })
            .catch((err) => {
                Notify.create({
                    message: err.response.data.datas,
                    color: 'negative',
                    textColor:'white',
                    position: 'top-right'
                })
            })
        },

        confirmDeleteAudit: function(audit) {
            Dialog.create({
                title: 'Confirm Suppression',
                message: `Audit «${audit.name}» will be permanently deleted`,
                ok: {label: 'Confirm', color: 'negative'},
                cancel: {label: 'Cancel', color: 'white'}
            })
            .onOk(() => this.deleteAudit(audit._id))
        },

        // Convert blob to text
        BlobReader: function(data) {
            const fileReader = new FileReader();

            return new Promise((resolve, reject) => {
                fileReader.onerror = () => {
                    fileReader.abort()
                    reject(new Error('Problem parsing blob'));
                }

                fileReader.onload = () => {
                    resolve(fileReader.result)
                }

                fileReader.readAsText(data)
            })
        },

        generateReport: function(auditId) {
            var downloadNotif = Notify.create({
                spinner: QSpinnerGears,
                message: 'Generating the Report',
                color: "blue",
                timeout: 0,
                group: false
            })
            AuditService.generateAuditReport(auditId)
            .then(response => {
                var blob = new Blob([response.data], {type: "application/octet-stream"});
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = response.headers['content-disposition'].split('"')[1];
                document.body.appendChild(link);
                link.click();
                link.remove();

                downloadNotif({
                    icon: 'done',
                    spinner: false,
                    message: 'Report successfully generated',
                    color: 'green',
                    timeout: 2500
                })
              })
            .catch( async err => {
                var message = "Error generating template"
                if (err.response && err.response.data) {
                    var blob = new Blob([err.response.data], {type: "application/json"})
                    var blobData = await this.BlobReader(blob)
                    message = JSON.parse(blobData).datas
                }
                downloadNotif()
                Notify.create({
                    message: message,
                    type: 'negative',
                    textColor:'white',
                    position: 'top',
                    closeBtn: true,
                    timeout: 0,
                    classes: "text-pre-wrap"
                })
            })
        },

        exportAudit: function(auditId, format) {
            var downloadNotif = Notify.create({
                spinner: QSpinnerGears,
                message: `Exporting Audit as ${format.toUpperCase()}`,
                color: "blue",
                timeout: 0,
                group: false
            });
        
            AuditService.getAudit(auditId)
                .then(response => {
                    if (format === 'json') {
                        this.downloadJSON(response.data, auditId);
                    } else if (format === 'zip') {
                        this.downloadZIP(response.data, auditId);
                    }
        
                    downloadNotif({
                        icon: 'done',
                        spinner: false,
                        message: `Audit successfully exported as ${format.toUpperCase()}`,
                        color: 'green',
                        timeout: 2500
                    });
                })
                .catch(async err => {
                    var message = "Error exporting audit";
                    if (err.response && err.response.data) {
                        var blob = new Blob([err.response.data], {type: "application/json"});
                        var blobData = await this.BlobReader(blob);
                        message = JSON.parse(blobData).datas;
                    }
                    downloadNotif();
                    Notify.create({
                        message: message,
                        type: 'negative',
                        textColor: 'white',
                        position: 'top',
                        closeBtn: true,
                        timeout: 0,
                        classes: "text-pre-wrap"
                    });
                });
        },
        
        downloadJSON: function(audit, auditId) {
            var blob = new Blob([JSON.stringify(audit, null, 2)], {type: "application/json"});
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `audit_${auditId}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        },
        
        downloadZIP: function(audit, auditId) {
            var zip = new JSZip();
            zip.file(`audit_${auditId}.json`, JSON.stringify(audit, null, 2));
            
            zip.generateAsync({type: "blob"}).then(function(content) {
                var link = document.createElement('a');
                var url = window.URL.createObjectURL(content);
                link.href = url;
                link.download = `audit_${auditId}.zip`;
                document.body.appendChild(link);
                link.click();
                window.URL.revokeObjectURL(url);
                link.remove();
            });
        },

        cleanErrors: function() {
            this.errors.name = '';
            this.errors.language = '';
            this.errors.auditType = '';
        },

        cleanCurrentAudit: function() {
            this.cleanErrors();
            this.currentAudit.name = '';
            this.currentAudit.language = '';
            this.currentAudit.auditType = '';
            this.currentAudit.type = 'default';
        },

        // Convert language locale of audit for table display
        convertLocale: function(locale) {
            for (var i=0; i<this.languages.length; i++)
                if (this.languages[i].locale === locale)
                    return this.languages[i].language;
            return ""
        },

        convertParticipants: function(row) {
            var collabs = (row.collaborators)? row.collaborators: [];
            var result = (row.creator)? [row.creator.username]: [];
            collabs.forEach(collab => result.push(collab.username));
            return result.join(', '); 
        },

        customFilter: function(rows, terms, cols, getCellValue) {
            var username = this.UserService.user.username.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

            var nameTerm = (terms.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            var auditTypeTerm = (terms.auditType || "").toLowerCase()
            var languageTerm = (terms.language)? terms.language.toLowerCase(): ""
            var companyTerm = (terms.company)? terms.company.toLowerCase(): ""
            var usersTerm = (terms.users || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            var dateTerm = (terms.date)? terms.date.toLowerCase(): ""

            return rows && rows.filter(row => {
                var name = (row.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                var auditType = (row.auditType || "").toLowerCase()
                var language = (row.language)? row.language.toLowerCase(): ""
                var companyName = (row.company)? row.company.name.toLowerCase(): ""
                var users = this.convertParticipants(row).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                var date = (row.createdAt)? row.createdAt.split('T')[0]: "";

                return name.indexOf(nameTerm) > -1 &&
                    (!auditTypeTerm || auditTypeTerm === auditType) &&
                    language.indexOf(languageTerm) > -1 &&
                    (!companyTerm || companyTerm === companyName) &&
                    users.indexOf(usersTerm) > -1 &&
                    date.indexOf(dateTerm) > -1 &&
                    ((this.myAudits && users.indexOf(username) > -1) || !this.myAudits) &&
                    ((this.displayConnected && row.connected && row.connected.length > 0) || !this.displayConnected) &&
                    ((this.displayReadyForReview && users.indexOf(username) < 0 && row.state === 'REVIEW') || !this.displayReadyForReview)
            })
        },

        dblClick: function(evt, row) {
            this.$router.push('/audits/'+row._id)      
        },

        triggerFileInput: function() {
            this.$refs.fileInput.click();
        },

        //A function responsible for importing the audits from JSON files
        importAudit(event) {
            const file = event.target.files[0];
            if (!file) {
                return;
            }
        
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
        
                    console.log("Parsed JSON content: ", jsonData);
        
                    // Call the new function to create audit from JSON data
                    this.importCreateAudit(jsonData);
        
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                    Notify.create({
                        message: 'Error reading the JSON file.',
                        type: 'negative',
                        textColor: 'white',
                        position: 'top',
                        closeBtn: true
                    });
                }
            };
            reader.readAsText(file);
        }
        
    }

}
