# SPDX-FileCopyrightText: 2021 iteratec GmbH
#
# SPDX-License-Identifier: Apache-2.0

import abc
from datetime import datetime
from typing import Dict, List, Optional

FINDING = Dict[str, any]


class AbstractScanner(abc.ABC):

    @property
    @abc.abstractmethod
    def git_type(self) -> str:
        raise NotImplementedError()

    @abc.abstractmethod
    def process(self, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None) -> List[FINDING]:
        raise NotImplementedError()

    def _create_finding(self, repo_id: str, web_url: str, full_name: str, owner_type: str, owner_id: str,
                        owner_name: str, created_at: str, last_activity_at: str, visibility: str,
                        archived: bool, topics: list, last_commit_id: str = None) -> FINDING:
        finding = {
            'name': f'{self.git_type} Repo',
            'description': f'A {self.git_type} repository',
            'category': 'Git Repository',
            'osi_layer': 'APPLICATION',
            'severity': 'INFORMATIONAL',
            'attributes': {
                'id': repo_id,
                'web_url': web_url,
                'full_name': full_name,
                'owner_type': owner_type,
                'owner_id': owner_id,
                'topics': topics,
                'owner_name': owner_name,
                'created_at': created_at,
                'last_activity_at': last_activity_at,
                'visibility': visibility,
                'archived': archived,
            }
        }
        if last_commit_id is not None:
            finding["attributes"]["last_commit_id"] = last_commit_id
        return finding
