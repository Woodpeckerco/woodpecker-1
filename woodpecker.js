const
  request = require('request-promise-any'),
  moment = require('moment')

class Woodpecker {
  constructor(key) {
    this.key = key

    this.api = 'https://api.woodpecker.co/rest/v1/'

    this.prospectStatus = {
      REPLIED: 'REPLIED',
      ACTIVE: 'ACTIVE',
      BLACKLIST: 'BLACKLIST',
      AUTOREPLIED: 'AUTOREPLIED',
      'TO-CHECK': 'TO-CHECK',
      'TO-REVIEW': 'TO-REVIEW',
      BOUNCED: 'BOUNCED',
      INVALID: 'INVALID',
      REPLIED: 'REPLIED'
    }

    this.activity = {
      OPENED: 'OPENED',
      'NOT-OPENED': 'NOT-OPENED',
      CLICKED: 'CLICKED',
      'NOT-CLICKED': 'NOT-CLICKED'
    }

    this.interest = {
      INTERESTED: 'INTERESTED',
      'NOT-INTERESTED': 'NOT-INTERESTED',
      'MAYBE-LATER': 'MAYBE-LATER',
      'NOT-MARKED': 'NOT-MARKED'
    }

    this.campaignStatus = {
      RUNNING: 'RUNNING',
      PAUSED: 'PAUSED',
      COMPLETED: 'COMPLETED',
      DRAFT: 'DRAFT',
      EDITED: 'EDITED',
      STOPPED: 'STOPPED'
    }

    this.webhookEvent = {
      REPLIED: 'prospect_replied',
      CLICKED: 'link_clicked',
      OPENED: 'email_opened',
      BOUNCED: 'prospect_bounced',
      INVALID: 'prospect_invalid',
      INTERESTED: 'prospect_interested',
      'MAYBE-LATER': 'prospect_maybe_later',
      'NOT-INTERESTED': 'prospect_not_interested',
      AUTOREPLIED: 'prospect_autoreplied',
      FOLLOWUP: 'followup_after_autoreply'
    }
  }

  req(url, data, method) {
    return new Promise((resolve, reject) => {
      if (!this.key) {
        return reject('API key is required. Woodpecker = require(\'woodpecker-api\')(KEY)')
      }
      method = method || 'GET'

      let r = {
        url: this.api + url,
        headers: {
          'Authorization': 'Basic ' + new Buffer(this.key).toString('base64') + ':X'
        },
        method: method
      }

      if (method == 'POST') {
        r.body = JSON.stringify(data)
      } else {
        r.qs = data
      }
      request(r).then(d => {
        try {
          d = JSON.parse(d)
        } catch (e) {}
        resolve(d)
      }).catch(reject)
    })
  }

  prospects(s) {

    let fieldMap = {
      lastName: 'last_name',
      firstName: 'first_name',
      email: 'email',
      company: 'company',
      industry: 'industry',
      website: 'website',
      tags: 'tags',
      title: 'title',
      phone: 'phone',
      address: 'address',
      city: 'city',
      state: 'state',
      country: 'country',
      snippet1: 'snippet1',
      snippet2: 'snippet2',
      snippet3: 'snippet3',
      snippet4: 'snippet4',
      snippet5: 'snippet5',
      snippet6: 'snippet6',
      snippet7: 'snippet7',
      snippet8: 'snippet8',
      snippet9: 'snippet9',
      snippet10: 'snippet10',
      snippet11: 'snippet11',
      snippet12: 'snippet12',
      snippet13: 'snippet13',
      snippet14: 'snippet14',
      snippet15: 'snippet15'
    }

    let p = {
      newest: () => {
        return this.req('prospects/newest')
      },
      replied: () => {
        return this.req('prospects/replied')
      },
      opened: () => {
        return this.req('prospects/opened')
      },
      clicked: () => {
        return this.req('prospects/clicked')
      },
      notContacted: () => {
        return this.req('prospects/not_contacted')
      },
      find: s => {
        if (!s) s = {}
        if (s.campaign && s.campaigns) {
          return Promise.reject('Only use `campaign` or `campaigns`, not both.')
        }

        if (s.campaign) {
          s.campaigns = s.campaign
          delete s.campaign
        }

        if (s.campaigns) {
          if (!(s.campaigns instanceof Array)) {
            s.campaigns = [s.campaigns]
          }
          s.campaigns_id = s.campaigns.join(',')
          delete s.campaigns
        }

        if (s.id && s.ids) {
          return Promise.reject('Only use `id` or `ids`, not both.')
        }

        if (s.ids) {
          s.id = s.ids
          delete s.ids
        }

        if (s.id) {
          if (!(s.id instanceof Array)) {
            s.id = [s.id]
          }
          s.id = s.id.join(',')
        }

        if (s.interest) {
          s.interested = s.interest
          delete s.interest
        }

        if (s.contacted === false || s.contacted === true) {
          s.contacted = s.contacted ? '1' : '0'
          delete s.contacted
        }

        if (s.updated) {
          s.diff = {
            data: s.updated,
            type: 'updated'
          }
          delete s.updated
        }

        if (s.opened) {
          s.diff = {
            data: s.opened,
            type: 'opened'
          }
          delete s.opened
        }

        if (s.clicked) {
          s.diff = {
            data: s.clicked,
            type: 'clicked'
          }
          delete s.clicked
        }

        if (s.diff && s.diff.type) {
          if (typeof s.diff.data == 'string') {
            s.diff = {
              op: s.diff.data.substr(0,1),
              date: s.diff.data.substr(1),
              type: s.diff.type
            }
          } else {
            s.diff = {
              op: s.diff.data.op,
              date: s.diff.data.data,
              type: s.diff.type
            }
          }

          if (s.diff.op != '<' && s.diff.op != '>') {
            return Promise.reject('Invalid date operation', s.diff.op)
          }
          switch (s.diff.type) {
            case 'updated':
              s.diff.type = 'updated'
              break
            case 'opened':
              if (s.activity != this.activity.OPENED) {
                return Promise.reject('Opened activity requires the `activity` param')
              }
              s.diff.type = 'last_opened'
              break
            case 'clicked':
              if (s.activity != this.activity.CLICKED) {
                return Promise.reject('Clicked activity requires the `activity` param')
              }
              s.diff.type = 'last_clicked'
              break
          }

          s.diff = s.diff.type + s.diff.op + moment(s.diff.date).format('YYYY-MM-DDTHH:mm:ssZZ')
        }

        if (!s.search) {
          s.search = ''
          for (let f in fieldMap) {
            if (s[f]) {
              s.search += (s.search ? ',' : '') + fieldMap[f] + '=' + s[f]
            }
          }
        }
        if (!s.search) {
          delete s.search
        }

        for (let f in fieldMap) {
          delete s[f]
        }

        let sortMap = {
          id: 'id',
          replied: 'last_replied',
          status: 'status',
          updated: 'updated',
          lastName: 'last_name',
          firstName: 'first_name',
          email: 'email',
          company: 'company',
          industry: 'industry',
          website: 'website',
          tags: 'tags',
          title: 'title',
          phone: 'phone',
          address: 'address',
          city: 'city',
          state: 'state',
          country: 'country',
          snippet1: 'snippet1',
          snippet2: 'snippet2',
          snippet3: 'snippet3',
          snippet4: 'snippet4',
          snippet5: 'snippet5',
          snippet6: 'snippet6',
          snippet7: 'snippet7',
          snippet8: 'snippet8',
          snippet9: 'snippet9',
          snippet10: 'snippet10',
          snippet11: 'snippet11',
          snippet12: 'snippet12',
          snippet13: 'snippet13',
          snippet14: 'snippet14',
          snippet15: 'snippet15',
          opened: 'last_opened',
          clicked: 'last_clicked'
        }

        if (!s.sort && s.$sort) {
          s.sort = ''
          for (let f in sortMap) {
            if (typeof s.$sort[f] != 'undefined' && s.$sort[f] != '') {
              if (f == 'opened' && s.activity != this.activity.OPENED) {
                return Promise.reject('Opened sort requires the `activity` param set to `OPENED`. Currently set to ', s.activity)
              }
              if (f == 'clicked' && s.activity != this.activity.CLICKED) {
                return Promise.reject('Clicked sort requires the `activity` param set to `CLICKED`. Currently set to ', s.activity)
              }

              let direction
              if (s.$sort[f] == 'DESC' || s.$sort[f] == -1 || s.$sort[f] === false || s.$sort[f] == '-') {
                direction = '-'
              } else {
                direction = ''
              }
              s.sort += (s.sort ? ',' : '') + direction + sortMap[f]
            }
          }
        }
        delete s.$sort

        if (s.$limit) {
          s.per_page = s.$limit
          delete s.$limit
        }

        if (parseInt(s.per_page, 10) > 500) {
          return Promise.reject('Maximum per page limit is 500. Default is 100.')
        }

        if (s.per_page) {
          s.per_page = parseInt(s.per_page, 10)
        }

        if (s.$page) {
          s.page = parseInt(s.$page, 10)
          delete s.$page
        }

        if (s.$skip) {
          s.page = parseInt(Math.floor(s.$skip / (s.per_page || 100)), 10)
          delete s.$skip
        }

        if (s.per_page) {
          let go = false
          for (let i in s) {
            if (i != 'per_page') {
              go = true
            }
          }
          if (!go) {
            return Promise.reject('Limit requires some sort of query to filter')
          }
        }

        if (s.id && s.per_page) {
          return Promise.reject('Can not limit when searching by id')
        }

        return this.req('prospects', s)
      },
      delete: (id, campaign) => {
        if (id.toString() == parseInt(id).toString()) {
          id = parseInt(id)
        }
        let del = ete => {
          let data = {id: ete}
          if (campaign) {
            data.campaigns_id = campaign
          }
          return this.req('prospects', data, 'DELETE')
        }
        if (typeof id == 'string') {
          return new Promise((resolve, reject) => {
            this.prospects().find({email: id, $limit: 1})
              .then(d => {
                if (!d || !d[0]) return reject('Could not find ', id)
                return del(d[0].id)
              })
              .then(resolve)
              .catch(reject)
          })
        } else {
          return del(id)
        }
      },
      edit: (prospects, campaign, noupdate) => {
        let data = {
          prospects: (prospects instanceof Array) ? prospects : [prospects],
          update: noupdate ? false : true
        }

        for (let p of data.prospects) {
          for (let f in fieldMap) {
            if (fieldMap[f] == f) continue
            if (p[f]) {
              p[fieldMap[f]] = p[f]
              delete p[f]
            }
          }
        }

        if (campaign) {
          data.campaign = {
            campaign_id: campaign
          }
          return this.req('add_prospects_campaign', data, 'POST')
        } else {
          return this.req('add_prospects_list', data, 'POST')
        }
      },
      blacklist: prospect => {
        if (prospect.toString() == parseInt(prospect).toString()) {
          prospect = parseInt(prospect)
        }

        let bl = pr => {
          let data = {
            prospect: {
              email: pr
            }
          }
          return this.req('stop_followups', data, 'POST')
        }

        if (typeof prospect == 'number') {
          return new Promise((resolve, reject) => {
            this.prospects().find({id: prospect})
              .then(d => {
                if (!d || !d[0]) return reject('Could not find ' + prospect)
                return bl(d[0].email)
              })
              .then(resolve)
              .catch(reject)
          })
        } else {
          return bl(prospect)
        }
      }
    }

    p.add = (prospects, campaign) => {
      return p.edit(prospects, campaign, true)
    }

    return p
  }

  campaigns() {
    return {
      find: s => {
        if (!s) s = {}
        if (s.ids) {
          s.id = s.ids
          delete s.ids
        }

        if (s.id) {
          if (!(s.id instanceof Array)) {
            s.id = [s.id]
          }
          s.id = s.id.join(',')
        }

        return this.req('campaign_list', s)
      }
    }
  }

  webhooks() {
    return {
      subscribe: (url, event) => {
        return this.req('webhooks/subscribe', {target_url: url, event: event}, 'POST')
      },
      unsubscribe: (url, event) => {
        return this.req('webhooks/unsubscribe', {target_url: url, event: event}, 'POST')
      }
    }
  }
}

module.exports = key => {
  return new Woodpecker(key)
}
